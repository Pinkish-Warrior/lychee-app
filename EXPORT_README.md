# Lychee Export Tool - User Guide

## Overview

The Lychee Export Tool allows you to export your notes from the Lychee database to **Notion** (CSV format) or **Obsidian** (Markdown format), with intelligent workspace organization based on category item counts.

## Key Features

### 🎯 Automatic Workspace Organization
- **Categories with 2+ notes** get their own dedicated workspace/folder
- **Categories with 1 note** are grouped into a "Single Items" workspace
- This keeps your notes organized without creating too many empty spaces

### 🔍 Action Item Detection
The tool automatically detects action items in your notes by looking for:
- Checkbox syntax: `- [ ]` or `- [x]`
- Keywords: TODO, Action:, Follow up, Need to, Must, Should, Call, Email, Schedule, Review, Complete
- Creates a separate action items section for easy task tracking

### 📊 Rich Metadata
Each exported note includes:
- **Category**: People, Projects, Ideas, or Admin
- **Confidence Score**: How confident the AI was in the classification
- **AI Reasoning**: Why the AI chose this category
- **Correction Status**: Whether you manually corrected the category
- **Creation Date**: When the note was created
- **Action Items**: Automatically extracted tasks

## Installation

### Prerequisites
- Python 3.11 or higher
- Access to your Lychee MySQL database
- Database credentials (host, port, username, password)

### Setup
1. The export script is already in your `lychee-app` directory: `lychee_export.py`
2. Install the required Python package:
   ```bash
   pip3 install mysql-connector-python
   ```

## Usage

### Basic Command Structure
```bash
python3 lychee_export.py [OPTIONS]
```

### Common Examples

#### Export to Obsidian
```bash
python3 lychee_export.py \
  --format obsidian \
  --output ./exports/obsidian \
  --db-password YOUR_DB_PASSWORD
```

#### Export to Notion
```bash
python3 lychee_export.py \
  --format notion \
  --output ./exports/notion \
  --db-password YOUR_DB_PASSWORD
```

#### Export to Both Formats
```bash
python3 lychee_export.py \
  --format both \
  --output ./exports \
  --db-password YOUR_DB_PASSWORD
```

#### Export Specific User's Notes
```bash
python3 lychee_export.py \
  --format both \
  --user-id 1 \
  --output ./exports \
  --db-password YOUR_DB_PASSWORD
```

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--format` | Export format: `obsidian`, `notion`, or `both` | `both` |
| `--user-id` | Filter notes by user ID (optional) | All users |
| `--output` | Output directory path | `./exports` |
| `--db-host` | Database host | `localhost` |
| `--db-port` | Database port | `3306` |
| `--db-name` | Database name | `lychee` |
| `--db-user` | Database username | `root` |
| `--db-password` | Database password | **(required)** |

### Using Environment Variables

Instead of command line arguments, you can set environment variables:

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=lychee
export DB_USER=root
export DB_PASSWORD=your_password

python3 lychee_export.py --format both
```

## Output Structure

### Obsidian Export

```
exports/obsidian/
├── People/                    # Dedicated workspace (3+ notes)
│   ├── Meeting-with-John.md
│   ├── Sarah-from-marketing.md
│   └── Follow-up-with-Mike.md
├── Projects/                  # Dedicated workspace (4+ notes)
│   ├── Website-redesign.md
│   ├── Mobile-app-development.md
│   ├── Q2-Marketing-Campaign.md
│   └── Database-migration.md
├── Single-Items/              # Categories with <2 notes
│   ├── AI-powered-task-tool.md  (Ideas)
│   └── Submit-expense-report.md (Admin)
└── _Index.md                  # Master index with all notes
```

#### Obsidian Note Format

```markdown
---
category: People
confidence: 92%
created: 2026-02-05
corrected: false
has_actions: true
workspace: People
---

# Meeting with John tomorrow at 2pm

Meeting with John tomorrow at 2pm to discuss Q1 roadmap. TODO: Prepare presentation slides

## 🎯 Action Items

- [ ] Prepare presentation slides

---

**AI Classification**
- **Category**: People
- **Confidence**: 92%
- **Reasoning**: Mentions a specific person (John) and a meeting context
```

### Notion Export

```
exports/notion/
├── lychee_notes.csv           # Main import file
└── NOTION_IMPORT_GUIDE.md     # Step-by-step import instructions
```

#### CSV Structure

| Column | Description |
|--------|-------------|
| Title | First line of the note |
| Content | Full note content |
| Category | People, Projects, Ideas, or Admin |
| Confidence | AI confidence percentage |
| Created Date | When the note was created |
| AI Reasoning | Why the AI chose this category |
| Workspace | Which workspace the note belongs to |
| Has Actions | Yes/No if action items detected |
| Action Items | List of detected action items |
| Corrected | If user manually corrected the category |

## Importing into Notion

### Step 1: Create a Database
1. Open Notion
2. Type `/database` and select "Table - Inline"
3. Name it "Lychee Notes"

### Step 2: Import CSV
1. Click the `•••` menu in the database
2. Select "Merge with CSV"
3. Upload `lychee_notes.csv`
4. Click "Import"

### Step 3: Create Workspace Views
Create filtered views for each workspace:
1. Click "+ New view"
2. Name it (e.g., "People Workspace")
3. Add filter: `Workspace` = `People Workspace`
4. Repeat for other workspaces

### Step 4: Create Action Items View
1. Create a new view called "Action Items"
2. Add filter: `Has Actions` = `Yes`
3. Sort by `Created Date` (newest first)

## Importing into Obsidian

### Step 1: Copy Files
1. Locate your exported folder (e.g., `exports/obsidian/`)
2. Copy the entire folder into your Obsidian vault

### Step 2: Open Index
1. In Obsidian, open `_Index.md`
2. This file contains links to all your notes organized by workspace

### Step 3: Explore
- Click on workspace sections to see notes in each category
- Use Obsidian's graph view to visualize connections
- Search for action items using `has_actions: true` in frontmatter

## Troubleshooting

### Connection Errors
**Problem**: `Error connecting to MySQL`

**Solutions**:
- Verify database credentials
- Check if MySQL server is running
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`
- Test connection: `mysql -h localhost -u root -p lychee`

### No Notes Found
**Problem**: `No notes found to export`

**Solutions**:
- Check if notes exist in database: `SELECT COUNT(*) FROM notes;`
- Verify user ID if using `--user-id` filter
- Ensure database name is correct

### Permission Errors
**Problem**: `Permission denied` when writing files

**Solutions**:
- Check output directory permissions
- Use absolute path for `--output`
- Run with appropriate user permissions

### Import Errors in Notion
**Problem**: CSV import fails or columns don't match

**Solutions**:
- Ensure CSV file is not corrupted
- Check file encoding (should be UTF-8)
- Try importing a smaller subset first
- Manually create columns if auto-detection fails

## Advanced Usage

### Custom Workspace Threshold

To change the minimum number of notes required for a dedicated workspace, edit the script:

```python
# In lychee_export.py, line 15
WORKSPACE_THRESHOLD = 2  # Change to 3, 4, etc.
```

### Custom Action Keywords

To add your own action detection keywords, edit the script:

```python
# In lychee_export.py, line 16
ACTION_KEYWORDS = ["TODO", "Action:", "Follow up", "YOUR_KEYWORD"]
```

### Filtering by Date Range

To export notes from a specific date range, modify the SQL query in the `fetch_notes` method:

```python
query = """
    SELECT * FROM notes
    WHERE userId = %s
    AND createdAt BETWEEN '2026-01-01' AND '2026-12-31'
    ORDER BY createdAt DESC
"""
```

## Testing with Sample Data

A test data file is included: `test_data.sql`

To test the export tool:

```bash
# Load test data
mysql -u root -p lychee < test_data.sql

# Run export with test user
python3 lychee_export.py \
  --format both \
  --user-id 999 \
  --output ./test-exports \
  --db-password YOUR_PASSWORD

# Check the output
ls -la test-exports/
```

This creates:
- 3 "People" notes → People workspace
- 4 "Projects" notes → Projects workspace
- 1 "Ideas" note → Single Items
- 1 "Admin" note → Single Items

## Tips & Best Practices

### For Obsidian Users
- Use the graph view to visualize note connections
- Create templates for recurring note types
- Use tags in addition to categories for finer organization
- Set up daily notes to link to action items

### For Notion Users
- Create a "Dashboard" page with embedded database views
- Use Notion's AI features to summarize long notes
- Set up automations to notify you of new action items
- Link notes to other databases (projects, contacts, etc.)

### General Tips
- Export regularly to keep your external tools in sync
- Review action items weekly
- Use the confidence score to identify notes that may need recategorization
- Leverage the AI reasoning to understand classification patterns

## Support & Feedback

If you encounter issues or have suggestions:
1. Check the troubleshooting section above
2. Review the error messages carefully
3. Verify your database connection and credentials
4. Test with the sample data to isolate the issue

## Future Enhancements

Potential improvements for future versions:
- Direct API integration with Notion/Obsidian
- Incremental sync (only export new/modified notes)
- Bidirectional sync (update Lychee when notes change)
- Webhook support for real-time sync
- Web interface for easier configuration
- Support for attachments and images
- Custom category definitions
- Bulk editing and recategorization tools
