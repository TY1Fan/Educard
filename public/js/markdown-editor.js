/**
 * Markdown Editor with Preview and Toolbar
 */

class MarkdownEditor {
  constructor(textareaId) {
    this.textarea = document.getElementById(textareaId);
    if (!this.textarea) return;
    
    this.initToolbar();
    this.initPreview();
    this.initShortcuts();
  }
  
  /**
   * Initialize markdown toolbar
   */
  initToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'md-toolbar';
    toolbar.innerHTML = `
      <div class="md-toolbar-group">
        <button type="button" class="md-btn" data-action="bold" title="Bold (Ctrl+B)">
          <strong>B</strong>
        </button>
        <button type="button" class="md-btn" data-action="italic" title="Italic (Ctrl+I)">
          <em>I</em>
        </button>
        <button type="button" class="md-btn" data-action="strikethrough" title="Strikethrough">
          <s>S</s>
        </button>
      </div>
      <div class="md-toolbar-divider"></div>
      <div class="md-toolbar-group">
        <button type="button" class="md-btn" data-action="heading" title="Heading">
          H1
        </button>
        <button type="button" class="md-btn" data-action="link" title="Link (Ctrl+K)">
          🔗
        </button>
        <button type="button" class="md-btn" data-action="code" title="Inline Code">
          &lt;/&gt;
        </button>
        <button type="button" class="md-btn" data-action="codeblock" title="Code Block">
          { }
        </button>
      </div>
      <div class="md-toolbar-divider"></div>
      <div class="md-toolbar-group">
        <button type="button" class="md-btn" data-action="ul" title="Bullet List">
          ≡
        </button>
        <button type="button" class="md-btn" data-action="ol" title="Numbered List">
          1.
        </button>
        <button type="button" class="md-btn" data-action="quote" title="Quote">
          "
        </button>
      </div>
      <div class="md-toolbar-divider"></div>
      <div class="md-toolbar-group">
        <button type="button" class="md-btn md-btn-help" data-action="help" title="Markdown Help">
          ?
        </button>
      </div>
    `;
    
    this.textarea.parentNode.insertBefore(toolbar, this.textarea);
    
    // Add event listeners to toolbar buttons
    toolbar.querySelectorAll('.md-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = btn.getAttribute('data-action');
        this.executeAction(action);
      });
    });
  }
  
  /**
   * Initialize preview functionality
   */
  initPreview() {
    const container = this.textarea.parentNode;
    
    // Create tabs
    const tabs = document.createElement('div');
    tabs.className = 'md-tabs';
    tabs.innerHTML = `
      <button type="button" class="md-tab md-tab-active" data-tab="write">Write</button>
      <button type="button" class="md-tab" data-tab="preview">Preview</button>
    `;
    
    container.insertBefore(tabs, this.textarea.previousSibling);
    
    // Create preview area
    const preview = document.createElement('div');
    preview.className = 'md-preview';
    preview.style.display = 'none';
    preview.innerHTML = '<div class="md-preview-empty">Nothing to preview</div>';
    
    this.textarea.parentNode.insertBefore(preview, this.textarea.nextSibling);
    
    // Tab switching
    tabs.querySelectorAll('.md-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        
        // Update active tab
        tabs.querySelectorAll('.md-tab').forEach(t => t.classList.remove('md-tab-active'));
        tab.classList.add('md-tab-active');
        
        if (tabName === 'write') {
          this.textarea.style.display = 'block';
          preview.style.display = 'none';
        } else {
          this.textarea.style.display = 'none';
          preview.style.display = 'block';
          this.updatePreview(preview);
        }
      });
    });
  }
  
  /**
   * Update preview content
   */
  async updatePreview(previewElement) {
    const content = this.textarea.value.trim();
    
    if (!content) {
      previewElement.innerHTML = '<div class="md-preview-empty">Nothing to preview</div>';
      return;
    }
    
    try {
      // Use marked.js to render markdown (loaded via CDN in layout)
      if (typeof marked !== 'undefined') {
        const html = marked.parse(content);
        previewElement.innerHTML = `<div class="markdown-content">${html}</div>`;
      } else {
        previewElement.innerHTML = `<div class="markdown-content">${this.escapeHtml(content)}</div>`;
      }
    } catch (error) {
      console.error('Preview error:', error);
      previewElement.innerHTML = '<div class="md-preview-error">Preview error</div>';
    }
  }
  
  /**
   * Execute markdown formatting action
   */
  executeAction(action) {
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    const selectedText = this.textarea.value.substring(start, end);
    const beforeText = this.textarea.value.substring(0, start);
    const afterText = this.textarea.value.substring(end);
    
    let newText = '';
    let cursorOffset = 0;
    
    switch (action) {
      case 'bold':
        newText = `**${selectedText || 'bold text'}**`;
        cursorOffset = selectedText ? newText.length : 2;
        break;
        
      case 'italic':
        newText = `*${selectedText || 'italic text'}*`;
        cursorOffset = selectedText ? newText.length : 1;
        break;
        
      case 'strikethrough':
        newText = `~~${selectedText || 'strikethrough'}~~`;
        cursorOffset = selectedText ? newText.length : 2;
        break;
        
      case 'heading':
        newText = `## ${selectedText || 'Heading'}`;
        cursorOffset = selectedText ? newText.length : 3;
        break;
        
      case 'link':
        const url = selectedText.startsWith('http') ? selectedText : 'https://example.com';
        const linkText = selectedText.startsWith('http') ? 'link text' : (selectedText || 'link text');
        newText = `[${linkText}](${url})`;
        cursorOffset = 1;
        break;
        
      case 'code':
        newText = `\`${selectedText || 'code'}\``;
        cursorOffset = selectedText ? newText.length : 1;
        break;
        
      case 'codeblock':
        newText = `\`\`\`\n${selectedText || 'code here'}\n\`\`\``;
        cursorOffset = selectedText ? newText.length : 4;
        break;
        
      case 'ul':
        newText = selectedText ? selectedText.split('\n').map(line => `- ${line}`).join('\n') : '- List item';
        cursorOffset = newText.length;
        break;
        
      case 'ol':
        newText = selectedText ? selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n') : '1. List item';
        cursorOffset = newText.length;
        break;
        
      case 'quote':
        newText = selectedText ? selectedText.split('\n').map(line => `> ${line}`).join('\n') : '> Quote';
        cursorOffset = newText.length;
        break;
        
      case 'help':
        this.showHelp();
        return;
        
      default:
        return;
    }
    
    // Update textarea content
    this.textarea.value = beforeText + newText + afterText;
    
    // Set cursor position
    const newCursorPos = start + cursorOffset;
    this.textarea.setSelectionRange(newCursorPos, newCursorPos);
    this.textarea.focus();
  }
  
  /**
   * Initialize keyboard shortcuts
   */
  initShortcuts() {
    this.textarea.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            this.executeAction('bold');
            break;
          case 'i':
            e.preventDefault();
            this.executeAction('italic');
            break;
          case 'k':
            e.preventDefault();
            this.executeAction('link');
            break;
        }
      }
    });
  }
  
  /**
   * Show markdown help dialog
   */
  showHelp() {
    const existingModal = document.querySelector('.md-help-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'md-help-modal';
    modal.innerHTML = `
      <div class="md-help-content">
        <div class="md-help-header">
          <h3>Markdown Formatting Guide</h3>
          <button type="button" class="md-help-close">&times;</button>
        </div>
        <div class="md-help-body">
          <table class="md-help-table">
            <thead>
              <tr>
                <th>Format</th>
                <th>Syntax</th>
                <th>Example</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Bold</strong></td>
                <td><code>**text**</code></td>
                <td><strong>bold text</strong></td>
              </tr>
              <tr>
                <td><em>Italic</em></td>
                <td><code>*text*</code></td>
                <td><em>italic text</em></td>
              </tr>
              <tr>
                <td><s>Strikethrough</s></td>
                <td><code>~~text~~</code></td>
                <td><s>strikethrough</s></td>
              </tr>
              <tr>
                <td>Heading</td>
                <td><code>## Heading</code></td>
                <td><h3 style="margin:0">Heading</h3></td>
              </tr>
              <tr>
                <td>Link</td>
                <td><code>[text](url)</code></td>
                <td><a href="#">link</a></td>
              </tr>
              <tr>
                <td>Inline Code</td>
                <td><code>\`code\`</code></td>
                <td><code>inline code</code></td>
              </tr>
              <tr>
                <td>Code Block</td>
                <td><code>\`\`\`<br>code<br>\`\`\`</code></td>
                <td><pre style="margin:0;padding:0.5rem">code block</pre></td>
              </tr>
              <tr>
                <td>Bullet List</td>
                <td><code>- item</code></td>
                <td>• item</td>
              </tr>
              <tr>
                <td>Numbered List</td>
                <td><code>1. item</code></td>
                <td>1. item</td>
              </tr>
              <tr>
                <td>Quote</td>
                <td><code>&gt; quote</code></td>
                <td style="border-left:3px solid #ccc;padding-left:0.5rem">quote</td>
              </tr>
            </tbody>
          </table>
          <div class="md-help-shortcuts">
            <h4>Keyboard Shortcuts</h4>
            <p><kbd>Ctrl+B</kbd> Bold • <kbd>Ctrl+I</kbd> Italic • <kbd>Ctrl+K</kbd> Link</p>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal handlers
    modal.querySelector('.md-help-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }
  
  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize markdown editors on page load
document.addEventListener('DOMContentLoaded', function() {
  // Initialize for content textarea (new thread, edit post)
  if (document.getElementById('content')) {
    new MarkdownEditor('content');
  }
});
