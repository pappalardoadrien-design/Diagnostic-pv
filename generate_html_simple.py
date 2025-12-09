
import sys
import json

# Read the HTML content
try:
    with open('/home/user/webapp/src/modules/unified-editor/views/unified-editor.html', 'r', encoding='utf-8') as f:
        html_content = f.read()

    # Escape for TypeScript string
    # We use JSON.dumps to get a safely escaped string, then slice off the quotes
    safe_string = json.dumps(html_content)
    
    # Create the TypeScript file content
    ts_content = f"""
// Auto-generated file. Do not edit manually.
export const unifiedEditorHtml = {safe_string};
"""

    # Write the TypeScript file
    with open('/home/user/webapp/src/modules/unified-editor/views/unified-editor-html.ts', 'w', encoding='utf-8') as f:
        f.write(ts_content)

    print("Successfully generated unified-editor-html.ts as plain string.")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
