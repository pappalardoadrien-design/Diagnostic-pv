
import base64
import sys

# Read the HTML content
try:
    with open('/home/user/webapp/src/modules/unified-editor/views/unified-editor.html', 'r', encoding='utf-8') as f:
        html_content = f.read()

    # Base64 encode
    encoded_bytes = base64.b64encode(html_content.encode('utf-8'))
    encoded_str = encoded_bytes.decode('utf-8')

    # Create the TypeScript file content
    ts_content = f"""
// Auto-generated file. Do not edit manually.
// This file contains the base64 encoded HTML for the Unified Editor.
// This avoids issues with template literal backticks and Cloudflare build process import restrictions.

export const unifiedEditorHtmlBase64 = "{encoded_str}";
"""

    # Write the TypeScript file
    with open('/home/user/webapp/src/modules/unified-editor/views/unified-editor-html.ts', 'w', encoding='utf-8') as f:
        f.write(ts_content)

    print("Successfully generated unified-editor-html.ts with base64 content.")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
