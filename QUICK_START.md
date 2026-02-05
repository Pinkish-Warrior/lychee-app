# Lychee to Notion/Obsidian Integration - Quick Start

## What This Does

This integration tool exports your Lychee notes to **Notion** or **Obsidian** with smart organization:

✅ **Automatic workspace grouping**: Categories with 2+ notes get their own workspace  
✅ **Action item detection**: Automatically finds TODOs and tasks in your notes  
✅ **Rich metadata**: Includes AI confidence, reasoning, and correction status  
✅ **Both formats supported**: Export to Notion (CSV) or Obsidian (Markdown)

## Installation (One-Time Setup)

### 1. Install Python Package
```bash
pip3 install mysql-connector-python
```

### 2. Get Your Database Credentials
You need:
- Database host (usually `localhost`)
- Database port (usually `3306`)
- Database name (usually `lychee`)
- Database username (usually `root`)
- Database password

## Usage

### Option 1: Export to Both Notion and Obsidian (Recommended)

```bash
cd /path/to/lychee-app

python3 lychee_export.py \
  --format both \
  --output ./my-exports \
  --db-password YOUR_DATABASE_PASSWORD
```

### Option 2: Export to Obsidian Only

```bash
python3 lychee_export.py \
  --format obsidian \
  --output ./my-exports \
  --db-password YOUR_DATABASE_PASSWORD
```

### Option 3: Export to Notion Only

```bash
python3 lychee_export.py \
  --format notion \
  --output ./my-exports \
  --db-password YOUR_DATABASE_PASSWORD
```

### Option 4: Export Specific User's Notes

```bash
python3 lychee_export.py \
  --format both \
  --user-id 1 \
  --output ./my-exports \
  --db-password YOUR_DATABASE_PASSWORD
```

## What You Get

### Obsidian Export Structure
```
my-exports/obsidian/
├── People/              # 3 notes about people
├── Projects/            # 5 notes about projects
├── Single-Items/        # 1 idea + 1 admin task
└── _Index.md           # Master index
```

Each note includes:
- Frontmatter with category, confidence, date
- Full note content
- Extracted action items (if any)
- AI classification reasoning

### Notion Export Structure
```
my-exports/notion/
├── lychee_notes.csv           # Import this into Notion
└── NOTION_IMPORT_GUIDE.md     # Step-by-step instructions
```

The CSV includes columns for:
- Title, Content, Category
- Confidence, Created Date
- AI Reasoning, Workspace
- Has Actions, Action Items
- Correction status

## Importing into Your Tools

### For Obsidian:
1. Copy the `obsidian` folder into your Obsidian vault
2. Open `_Index.md` to see all your notes
3. Done! 🎉

### For Notion:
1. Create a new database in Notion
2. Click `•••` menu → "Merge with CSV"
3. Upload `lychee_notes.csv`
4. Create filtered views for each workspace
5. Done! 🎉

Full instructions are in `NOTION_IMPORT_GUIDE.md`

## Testing Without Database

Want to see how it works without connecting to your database?

```bash
python3 test_export.py
```

This creates sample exports in `test-exports/` using mock data.

## Workspace Organization Logic

The tool automatically organizes your notes:

| Category | Note Count | Result |
|----------|------------|--------|
| People | 3 notes | ✅ Gets dedicated "People" workspace |
| Projects | 5 notes | ✅ Gets dedicated "Projects" workspace |
| Ideas | 1 note | → Goes to "Single Items" workspace |
| Admin | 1 note | → Goes to "Single Items" workspace |

**Rule**: Categories with 2+ notes get their own workspace. Others are grouped into "Single Items".

## Action Item Detection

The tool automatically detects action items by looking for:

- ✅ Checkbox syntax: `- [ ]` or `- [x]`
- ✅ Keywords: TODO, Action:, Follow up, Need to, Must, Should
- ✅ Action verbs: Call, Email, Schedule, Review, Complete

Example:
```
Input note:
"Meeting with John tomorrow. TODO: Prepare slides"

Extracted action:
- [ ] Prepare slides
```

## Troubleshooting

### "Error connecting to MySQL"
- Check if MySQL is running: `mysql -u root -p`
- Verify your database password
- Confirm database name: `SHOW DATABASES;`

### "No notes found"
- Check if notes exist: `SELECT COUNT(*) FROM notes;`
- Verify user ID if using `--user-id` filter

### "Permission denied"
- Check output directory permissions
- Use absolute path for `--output`

## Need More Help?

- **Full documentation**: See `EXPORT_README.md`
- **Architecture details**: See `lychee-integration-design.md`
- **Test with sample data**: Run `python3 test_export.py`

## Examples

### Export all notes to both formats:
```bash
python3 lychee_export.py --format both --db-password mypass123
```

### Export user 5's notes to Obsidian:
```bash
python3 lychee_export.py --format obsidian --user-id 5 --db-password mypass123
```

### Export to custom directory:
```bash
python3 lychee_export.py --format both --output ~/Documents/lychee-backup --db-password mypass123
```

### Use environment variable for password:
```bash
export DB_PASSWORD=mypass123
python3 lychee_export.py --format both
```

## Next Steps

1. **Run the export** using one of the commands above
2. **Import into your tool** (Notion or Obsidian)
3. **Review action items** - they're automatically extracted!
4. **Set up regular exports** - run weekly to keep in sync

## Tips

- Export regularly to keep your tools in sync
- Use the "Has Actions" filter in Notion to see all tasks
- In Obsidian, search for `has_actions: true` to find action items
- Review notes with low confidence scores - they may need recategorization

---

**Questions?** Check the full documentation in `EXPORT_README.md`
