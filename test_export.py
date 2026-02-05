#!/usr/bin/env python3
"""
Test script for Lychee export functionality
Creates mock data and tests export without requiring database connection
"""

import os
import sys
from pathlib import Path
from datetime import datetime
from decimal import Decimal

# Add parent directory to path to import lychee_export
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Mock the mysql.connector module since we're testing without a real database
class MockConnection:
    def is_connected(self):
        return True
    
    def close(self):
        pass
    
    def cursor(self, dictionary=False):
        return MockCursor()

class MockCursor:
    def execute(self, query, params=None):
        pass
    
    def fetchall(self):
        # Return mock test data
        return [
            # People category (3 notes - should get dedicated workspace)
            {
                'id': 1,
                'userId': 999,
                'content': 'Meeting with John tomorrow at 2pm to discuss Q1 roadmap. TODO: Prepare presentation slides',
                'category': 'People',
                'confidence': Decimal('0.92'),
                'reasoning': 'Mentions a specific person (John) and a meeting context',
                'isCorrected': 0,
                'originalCategory': None,
                'createdAt': datetime(2026, 2, 5, 10, 0, 0),
                'updatedAt': datetime(2026, 2, 5, 10, 0, 0)
            },
            {
                'id': 2,
                'userId': 999,
                'content': 'Sarah from marketing wants to collaborate on the new campaign. Need to schedule a call next week.',
                'category': 'People',
                'confidence': Decimal('0.88'),
                'reasoning': 'References a person (Sarah) and collaboration context',
                'isCorrected': 0,
                'originalCategory': None,
                'createdAt': datetime(2026, 2, 4, 14, 30, 0),
                'updatedAt': datetime(2026, 2, 4, 14, 30, 0)
            },
            {
                'id': 3,
                'userId': 999,
                'content': 'Follow up with Mike about the budget approval. He mentioned getting back to me by Friday.',
                'category': 'People',
                'confidence': Decimal('0.85'),
                'reasoning': 'Mentions a person (Mike) and follow-up action',
                'isCorrected': 0,
                'originalCategory': None,
                'createdAt': datetime(2026, 2, 3, 9, 15, 0),
                'updatedAt': datetime(2026, 2, 3, 9, 15, 0)
            },
            # Projects category (4 notes - should get dedicated workspace)
            {
                'id': 4,
                'userId': 999,
                'content': 'Website redesign project: Complete wireframes by end of week. Review with design team on Monday.',
                'category': 'Projects',
                'confidence': Decimal('0.95'),
                'reasoning': 'Clear project context with deliverables and timeline',
                'isCorrected': 0,
                'originalCategory': None,
                'createdAt': datetime(2026, 2, 5, 11, 0, 0),
                'updatedAt': datetime(2026, 2, 5, 11, 0, 0)
            },
            {
                'id': 5,
                'userId': 999,
                'content': 'Mobile app development - Sprint 3 goals:\n- [ ] Implement user authentication\n- [ ] Add push notifications\n- [ ] Fix navigation bugs',
                'category': 'Projects',
                'confidence': Decimal('0.93'),
                'reasoning': 'Project-specific tasks with technical details',
                'isCorrected': 0,
                'originalCategory': None,
                'createdAt': datetime(2026, 2, 4, 16, 0, 0),
                'updatedAt': datetime(2026, 2, 4, 16, 0, 0)
            },
            {
                'id': 6,
                'userId': 999,
                'content': 'Q2 Marketing Campaign launched successfully. Track metrics: 10k impressions, 2.5% CTR, 150 conversions.',
                'category': 'Projects',
                'confidence': Decimal('0.90'),
                'reasoning': 'Project update with measurable outcomes',
                'isCorrected': 0,
                'originalCategory': None,
                'createdAt': datetime(2026, 2, 2, 13, 45, 0),
                'updatedAt': datetime(2026, 2, 2, 13, 45, 0)
            },
            {
                'id': 7,
                'userId': 999,
                'content': 'Database migration project delayed. Need to: 1) Assess risks 2) Update timeline 3) Communicate to stakeholders',
                'category': 'Projects',
                'confidence': Decimal('0.87'),
                'reasoning': 'Project status update with action items',
                'isCorrected': 0,
                'originalCategory': None,
                'createdAt': datetime(2026, 2, 1, 10, 30, 0),
                'updatedAt': datetime(2026, 2, 1, 10, 30, 0)
            },
            # Ideas category (1 note - should go to Single Items)
            {
                'id': 8,
                'userId': 999,
                'content': 'New product idea: AI-powered task prioritization tool that learns from user behavior and suggests optimal work schedules.',
                'category': 'Ideas',
                'confidence': Decimal('0.94'),
                'reasoning': 'Creative concept for a new product',
                'isCorrected': 0,
                'originalCategory': None,
                'createdAt': datetime(2026, 2, 5, 15, 20, 0),
                'updatedAt': datetime(2026, 2, 5, 15, 20, 0)
            },
            # Admin category (1 note - should go to Single Items)
            {
                'id': 9,
                'userId': 999,
                'content': 'Action: Submit expense report by Friday. Include receipts from client dinner ($250) and conference travel ($800).',
                'category': 'Admin',
                'confidence': Decimal('0.91'),
                'reasoning': 'Administrative task with financial details',
                'isCorrected': 0,
                'originalCategory': None,
                'createdAt': datetime(2026, 2, 4, 8, 0, 0),
                'updatedAt': datetime(2026, 2, 4, 8, 0, 0)
            },
            # Corrected note
            {
                'id': 10,
                'userId': 999,
                'content': 'Team building event next month - organize venue, catering, and activities. Budget: $5000',
                'category': 'Projects',
                'confidence': Decimal('0.78'),
                'reasoning': 'Initially classified as Admin but corrected to Projects',
                'isCorrected': 1,
                'originalCategory': 'Admin',
                'createdAt': datetime(2026, 1, 30, 12, 0, 0),
                'updatedAt': datetime(2026, 2, 5, 9, 0, 0)
            }
        ]
    
    def close(self):
        pass

# Mock mysql.connector
class MockMySQLConnector:
    Error = Exception
    
    @staticmethod
    def connect(**kwargs):
        return MockConnection()

# Replace mysql.connector with mock
sys.modules['mysql.connector'] = MockMySQLConnector()
sys.modules['mysql.connector.Error'] = MockMySQLConnector.Error

# Now import the exporter
from lychee_export import LycheeExporter

def test_export():
    """Test the export functionality with mock data"""
    print("=" * 60)
    print("Lychee Export Tool - Test Mode")
    print("=" * 60)
    print("\nUsing mock data (no database connection required)\n")
    
    # Create test output directory
    test_output = Path('./test-exports')
    test_output.mkdir(exist_ok=True)
    
    # Initialize exporter with dummy config
    exporter = LycheeExporter({
        'host': 'localhost',
        'port': 3306,
        'database': 'lychee',
        'user': 'test',
        'password': 'test'
    })
    
    # Mock the connection
    exporter.connection = MockConnection()
    
    print("✓ Initialized exporter with mock connection")
    
    # Fetch mock notes
    notes = exporter.fetch_notes(999)
    
    print(f"\n📊 Test Data Summary:")
    print(f"   Total notes: {len(notes)}")
    
    # Group by category
    grouped = exporter.group_by_category(notes)
    for category, category_notes in grouped.items():
        print(f"   {category}: {len(category_notes)} notes")
    
    # Test workspace organization
    workspaces, single_items = exporter.organize_workspaces(grouped)
    
    print(f"\n🗂️  Workspace Organization:")
    print(f"   Dedicated workspaces: {len(workspaces)}")
    for category in workspaces.keys():
        print(f"     - {category}")
    print(f"   Single items: {len(single_items)}")
    
    # Test action item detection
    print(f"\n🎯 Action Item Detection:")
    action_count = 0
    for note in notes:
        has_actions, actions = exporter.detect_action_items(note['content'])
        if has_actions:
            action_count += 1
            print(f"   Note {note['id']}: {len(actions)} action(s) detected")
    print(f"   Total notes with actions: {action_count}")
    
    # Test Obsidian export
    print("\n" + "=" * 60)
    obsidian_dir = str(test_output / 'obsidian')
    exporter.export_to_obsidian(notes, obsidian_dir)
    
    # Verify Obsidian output
    obsidian_path = Path(obsidian_dir)
    if obsidian_path.exists():
        folders = [f for f in obsidian_path.iterdir() if f.is_dir()]
        files = list(obsidian_path.glob('**/*.md'))
        print(f"\n✓ Verification:")
        print(f"   Folders created: {len(folders)}")
        for folder in folders:
            file_count = len(list(folder.glob('*.md')))
            print(f"     - {folder.name}: {file_count} files")
        print(f"   Total markdown files: {len(files)}")
        
        # Check for index file
        index_file = obsidian_path / '_Index.md'
        if index_file.exists():
            print(f"   ✓ Index file created: {index_file.name}")
    
    # Test Notion export
    print("\n" + "=" * 60)
    notion_dir = str(test_output / 'notion')
    exporter.export_to_notion(notes, notion_dir)
    
    # Verify Notion output
    notion_path = Path(notion_dir)
    if notion_path.exists():
        csv_file = notion_path / 'lychee_notes.csv'
        guide_file = notion_path / 'NOTION_IMPORT_GUIDE.md'
        
        print(f"\n✓ Verification:")
        if csv_file.exists():
            # Count rows in CSV
            with open(csv_file, 'r', encoding='utf-8') as f:
                row_count = sum(1 for line in f) - 1  # Subtract header
            print(f"   ✓ CSV file created: {csv_file.name} ({row_count} rows)")
        
        if guide_file.exists():
            print(f"   ✓ Import guide created: {guide_file.name}")
    
    print("\n" + "=" * 60)
    print("✓ All tests completed successfully!")
    print("=" * 60)
    print(f"\nTest output location: {test_output.absolute()}")
    print("\nYou can now:")
    print("1. Review the generated files in the test-exports directory")
    print("2. Test importing the CSV into Notion")
    print("3. Copy the Obsidian folder into your vault")
    print("\n")

if __name__ == '__main__':
    try:
        test_export()
    except Exception as e:
        print(f"\n✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
