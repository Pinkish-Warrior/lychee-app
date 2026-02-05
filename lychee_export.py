#!/usr/bin/env python3
"""
Lychee Note Export Tool
Exports notes from Lychee database to Notion (CSV) or Obsidian (Markdown) format
with automatic workspace organization based on category item counts.
"""

import os
import sys
import argparse
import csv
import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Tuple
from collections import defaultdict
import mysql.connector
from mysql.connector import Error

# Configuration
WORKSPACE_THRESHOLD = 2  # Minimum items for dedicated workspace
ACTION_KEYWORDS = ["TODO", "Action:", "Follow up", "Need to", "Must", "Should", "Call", "Email", "Schedule", "Review", "Complete"]

class LycheeExporter:
    def __init__(self, db_config: Dict[str, str]):
        """Initialize the exporter with database configuration."""
        self.db_config = db_config
        self.connection = None
        
    def connect(self):
        """Establish database connection."""
        try:
            self.connection = mysql.connector.connect(**self.db_config)
            if self.connection.is_connected():
                print(f"✓ Connected to MySQL database")
                return True
        except Error as e:
            print(f"✗ Error connecting to MySQL: {e}")
            return False
    
    def disconnect(self):
        """Close database connection."""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("✓ Database connection closed")
    
    def fetch_notes(self, user_id: int = None) -> List[Dict[str, Any]]:
        """Fetch all notes from database, optionally filtered by user ID."""
        if not self.connection or not self.connection.is_connected():
            print("✗ No database connection")
            return []
        
        try:
            cursor = self.connection.cursor(dictionary=True)
            
            if user_id:
                query = """
                    SELECT id, userId, content, category, confidence, reasoning, 
                           isCorrected, originalCategory, createdAt, updatedAt
                    FROM notes
                    WHERE userId = %s
                    ORDER BY createdAt DESC
                """
                cursor.execute(query, (user_id,))
            else:
                query = """
                    SELECT id, userId, content, category, confidence, reasoning, 
                           isCorrected, originalCategory, createdAt, updatedAt
                    FROM notes
                    ORDER BY createdAt DESC
                """
                cursor.execute(query)
            
            notes = cursor.fetchall()
            cursor.close()
            
            print(f"✓ Fetched {len(notes)} notes from database")
            return notes
            
        except Error as e:
            print(f"✗ Error fetching notes: {e}")
            return []
    
    def group_by_category(self, notes: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group notes by category."""
        grouped = defaultdict(list)
        for note in notes:
            category = note['category']
            grouped[category].append(note)
        return dict(grouped)
    
    def organize_workspaces(self, grouped_notes: Dict[str, List[Dict[str, Any]]]) -> Tuple[Dict[str, List[Dict[str, Any]]], List[Dict[str, Any]]]:
        """
        Organize notes into workspaces based on category count.
        Returns: (dedicated_workspaces, single_items)
        """
        dedicated_workspaces = {}
        single_items = []
        
        for category, notes in grouped_notes.items():
            if len(notes) >= WORKSPACE_THRESHOLD:
                dedicated_workspaces[category] = notes
            else:
                single_items.extend(notes)
        
        return dedicated_workspaces, single_items
    
    def detect_action_items(self, content: str) -> Tuple[bool, List[str]]:
        """
        Detect action items in note content.
        Returns: (has_actions, action_list)
        """
        actions = []
        has_actions = False
        
        # Check for checkbox syntax
        checkbox_pattern = r'[-*]\s*\[[ x]\]\s*(.+)'
        checkboxes = re.findall(checkbox_pattern, content, re.IGNORECASE)
        actions.extend(checkboxes)
        
        # Check for action keywords
        for keyword in ACTION_KEYWORDS:
            pattern = rf'{keyword}\s*:?\s*(.+?)(?:\n|$)'
            matches = re.findall(pattern, content, re.IGNORECASE)
            actions.extend(matches)
        
        if actions:
            has_actions = True
            # Remove duplicates while preserving order
            actions = list(dict.fromkeys(actions))
        
        return has_actions, actions
    
    def export_to_obsidian(self, notes: List[Dict[str, Any]], output_dir: str):
        """Export notes to Obsidian markdown format."""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Group and organize
        grouped = self.group_by_category(notes)
        workspaces, single_items = self.organize_workspaces(grouped)
        
        print(f"\n📁 Exporting to Obsidian format...")
        print(f"   Dedicated workspaces: {len(workspaces)}")
        print(f"   Single items: {len(single_items)}")
        
        # Create dedicated workspace folders
        for category, category_notes in workspaces.items():
            category_path = output_path / category
            category_path.mkdir(exist_ok=True)
            
            for note in category_notes:
                self._write_obsidian_note(note, category_path, category)
            
            print(f"   ✓ Created {category} workspace with {len(category_notes)} notes")
        
        # Create single items folder
        if single_items:
            single_path = output_path / "Single-Items"
            single_path.mkdir(exist_ok=True)
            
            for note in single_items:
                self._write_obsidian_note(note, single_path, "Single Items")
            
            print(f"   ✓ Created Single-Items workspace with {len(single_items)} notes")
        
        # Create index file
        self._create_obsidian_index(output_path, workspaces, single_items)
        
        print(f"\n✓ Obsidian export complete: {output_path}")
    
    def _write_obsidian_note(self, note: Dict[str, Any], folder: Path, workspace: str):
        """Write a single note as an Obsidian markdown file."""
        # Generate filename from content (first line or first 50 chars)
        first_line = note['content'].split('\n')[0][:50]
        safe_filename = re.sub(r'[^\w\s-]', '', first_line).strip().replace(' ', '-')
        if not safe_filename:
            safe_filename = f"note-{note['id']}"
        
        filepath = folder / f"{safe_filename}.md"
        
        # Handle duplicate filenames
        counter = 1
        while filepath.exists():
            filepath = folder / f"{safe_filename}-{counter}.md"
            counter += 1
        
        # Detect action items
        has_actions, actions = self.detect_action_items(note['content'])
        
        # Format confidence as percentage
        confidence_pct = float(note['confidence']) * 100
        
        # Create frontmatter
        frontmatter = f"""---
category: {note['category']}
confidence: {confidence_pct:.0f}%
created: {note['createdAt'].strftime('%Y-%m-%d')}
corrected: {bool(note['isCorrected'])}
has_actions: {has_actions}
workspace: {workspace}
---

"""
        
        # Create content
        content = f"# {first_line}\n\n{note['content']}\n\n"
        
        # Add action items section if detected
        if actions:
            content += "\n## 🎯 Action Items\n\n"
            for action in actions:
                content += f"- [ ] {action.strip()}\n"
            content += "\n"
        
        # Add metadata footer
        footer = f"""---

**AI Classification**
- **Category**: {note['category']}
- **Confidence**: {confidence_pct:.0f}%
- **Reasoning**: {note['reasoning']}
"""
        
        if note['isCorrected']:
            footer += f"- **Original Category**: {note['originalCategory']} (corrected by user)\n"
        
        # Write file
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(frontmatter + content + footer)
    
    def _create_obsidian_index(self, output_path: Path, workspaces: Dict, single_items: List):
        """Create a master index file for Obsidian."""
        index_path = output_path / "_Index.md"
        
        content = f"""# Lychee Notes Index

*Exported on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*

## 📊 Summary

- **Total Notes**: {sum(len(notes) for notes in workspaces.values()) + len(single_items)}
- **Dedicated Workspaces**: {len(workspaces)}
- **Single Items**: {len(single_items)}

---

## 📁 Workspaces

"""
        
        # Add workspace sections
        for category, notes in workspaces.items():
            content += f"\n### {category} ({len(notes)} notes)\n\n"
            for note in notes:
                first_line = note['content'].split('\n')[0][:50]
                safe_filename = re.sub(r'[^\w\s-]', '', first_line).strip().replace(' ', '-')
                if not safe_filename:
                    safe_filename = f"note-{note['id']}"
                
                # Find the actual filename (may have counter suffix)
                note_files = list((output_path / category).glob(f"{safe_filename}*.md"))
                if note_files:
                    actual_filename = note_files[0].name
                    content += f"- [[{category}/{actual_filename[:-3]}]]\n"
        
        # Add single items section
        if single_items:
            content += f"\n### Single Items ({len(single_items)} notes)\n\n"
            for note in single_items:
                first_line = note['content'].split('\n')[0][:50]
                safe_filename = re.sub(r'[^\w\s-]', '', first_line).strip().replace(' ', '-')
                if not safe_filename:
                    safe_filename = f"note-{note['id']}"
                
                note_files = list((output_path / "Single-Items").glob(f"{safe_filename}*.md"))
                if note_files:
                    actual_filename = note_files[0].name
                    content += f"- [[Single-Items/{actual_filename[:-3]}]] ({note['category']})\n"
        
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(content)
    
    def export_to_notion(self, notes: List[Dict[str, Any]], output_dir: str):
        """Export notes to Notion CSV format."""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        csv_path = output_path / "lychee_notes.csv"
        
        # Group and organize
        grouped = self.group_by_category(notes)
        workspaces, single_items = self.organize_workspaces(grouped)
        
        print(f"\n📊 Exporting to Notion CSV format...")
        
        # Prepare CSV data
        csv_data = []
        
        # Add workspace notes
        for category, category_notes in workspaces.items():
            for note in category_notes:
                csv_data.append(self._format_notion_row(note, f"{category} Workspace"))
        
        # Add single items
        for note in single_items:
            csv_data.append(self._format_notion_row(note, "Single Items"))
        
        # Write CSV
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=[
                'Title', 'Content', 'Category', 'Confidence', 'Created Date', 
                'AI Reasoning', 'Workspace', 'Has Actions', 'Action Items', 'Corrected'
            ])
            writer.writeheader()
            writer.writerows(csv_data)
        
        print(f"   ✓ Created CSV with {len(csv_data)} notes")
        print(f"\n✓ Notion export complete: {csv_path}")
        
        # Create import instructions
        self._create_notion_instructions(output_path)
    
    def _format_notion_row(self, note: Dict[str, Any], workspace: str) -> Dict[str, str]:
        """Format a note as a Notion CSV row."""
        first_line = note['content'].split('\n')[0][:100]
        confidence_pct = float(note['confidence']) * 100
        has_actions, actions = self.detect_action_items(note['content'])
        
        return {
            'Title': first_line,
            'Content': note['content'],
            'Category': note['category'],
            'Confidence': f"{confidence_pct:.0f}%",
            'Created Date': note['createdAt'].strftime('%Y-%m-%d'),
            'AI Reasoning': note['reasoning'],
            'Workspace': workspace,
            'Has Actions': 'Yes' if has_actions else 'No',
            'Action Items': '; '.join(actions) if actions else '',
            'Corrected': 'Yes' if note['isCorrected'] else 'No'
        }
    
    def _create_notion_instructions(self, output_path: Path):
        """Create import instructions for Notion."""
        instructions_path = output_path / "NOTION_IMPORT_GUIDE.md"
        
        content = """# Notion Import Guide

## Step 1: Create a New Database

1. Open Notion
2. Create a new page or navigate to where you want the database
3. Type `/database` and select "Table - Inline"
4. Name it "Lychee Notes"

## Step 2: Import the CSV

1. Click the `•••` menu in the top-right of your database
2. Select "Merge with CSV"
3. Upload the `lychee_notes.csv` file
4. Map the columns (should auto-detect)
5. Click "Import"

## Step 3: Configure Properties

The import will create these properties:
- **Title** (Title) - First line of the note
- **Content** (Text) - Full note content
- **Category** (Select) - People, Projects, Ideas, Admin
- **Confidence** (Text) - AI confidence percentage
- **Created Date** (Date) - When the note was created
- **AI Reasoning** (Text) - Why the AI chose this category
- **Workspace** (Select) - Which workspace the note belongs to
- **Has Actions** (Select) - Yes/No if action items detected
- **Action Items** (Text) - List of detected action items
- **Corrected** (Select) - If user manually corrected the category

## Step 4: Create Workspace Views

Create filtered views for each workspace:

1. Click "+ New view" at the top
2. Select "Table" or "Board"
3. Name it (e.g., "People Workspace")
4. Add filter: `Workspace` = `People Workspace`
5. Repeat for other workspaces

## Step 5: Create Action Items View

1. Create a new view called "Action Items"
2. Add filter: `Has Actions` = `Yes`
3. Sort by `Created Date` (newest first)
4. This gives you a quick view of all notes with action items

## Tips

- Use the "Workspace" property to quickly filter by category groups
- Create a "Board" view grouped by "Category" for visual organization
- Add checkboxes to "Action Items" for task tracking
- Use Notion's AI features to further process the content
"""
        
        with open(instructions_path, 'w', encoding='utf-8') as f:
            f.write(content)

def main():
    parser = argparse.ArgumentParser(
        description='Export Lychee notes to Notion or Obsidian format',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Export all notes to Obsidian format
  python lychee_export.py --format obsidian --output ./exports/obsidian
  
  # Export specific user's notes to Notion format
  python lychee_export.py --format notion --user-id 1 --output ./exports/notion
  
  # Export to both formats
  python lychee_export.py --format both --user-id 1 --output ./exports

Database connection:
  Set environment variables or use command line arguments:
  - DB_HOST (default: localhost)
  - DB_PORT (default: 3306)
  - DB_NAME (default: lychee)
  - DB_USER (default: root)
  - DB_PASSWORD (required)
        """
    )
    
    parser.add_argument('--format', choices=['obsidian', 'notion', 'both'], 
                        default='both', help='Export format')
    parser.add_argument('--user-id', type=int, help='User ID to filter notes (optional)')
    parser.add_argument('--output', default='./exports', help='Output directory')
    
    # Database connection arguments
    parser.add_argument('--db-host', default=os.getenv('DB_HOST', 'localhost'))
    parser.add_argument('--db-port', type=int, default=int(os.getenv('DB_PORT', '3306')))
    parser.add_argument('--db-name', default=os.getenv('DB_NAME', 'lychee'))
    parser.add_argument('--db-user', default=os.getenv('DB_USER', 'root'))
    parser.add_argument('--db-password', default=os.getenv('DB_PASSWORD'))
    
    args = parser.parse_args()
    
    # Validate database password
    if not args.db_password:
        print("✗ Error: Database password required (use --db-password or DB_PASSWORD env var)")
        sys.exit(1)
    
    # Database configuration
    db_config = {
        'host': args.db_host,
        'port': args.db_port,
        'database': args.db_name,
        'user': args.db_user,
        'password': args.db_password
    }
    
    print("=" * 60)
    print("Lychee Note Export Tool")
    print("=" * 60)
    
    # Initialize exporter
    exporter = LycheeExporter(db_config)
    
    # Connect to database
    if not exporter.connect():
        sys.exit(1)
    
    try:
        # Fetch notes
        notes = exporter.fetch_notes(args.user_id)
        
        if not notes:
            print("\n⚠ No notes found to export")
            return
        
        # Export based on format
        if args.format in ['obsidian', 'both']:
            obsidian_dir = os.path.join(args.output, 'obsidian')
            exporter.export_to_obsidian(notes, obsidian_dir)
        
        if args.format in ['notion', 'both']:
            notion_dir = os.path.join(args.output, 'notion')
            exporter.export_to_notion(notes, notion_dir)
        
        print("\n" + "=" * 60)
        print("✓ Export completed successfully!")
        print("=" * 60)
        
    finally:
        exporter.disconnect()

if __name__ == '__main__':
    main()
