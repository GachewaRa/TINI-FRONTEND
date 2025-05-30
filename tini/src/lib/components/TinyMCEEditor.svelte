<!-- src/lib/components/TinyMCEEditor.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { selectedText, isCreatingNote } from '$lib/stores';
  
  export let content = '';
  export let disabled = false;
  export let height = 400;
  export let showCreateNoteButton = false; // For highlights view

  export let uploadEndpoint = 'http://127.0.0.1:8000/api/v1/uploads/image/'; // Your FastAPI endpoint
  
  let editor: any;
  let editorContainer: HTMLElement;
  
  onMount(async () => {
    // Load TinyMCE from CDN
    if (!window.tinymce) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.2/tinymce.min.js';
      script.onload = initEditor;
      document.head.appendChild(script);
    } else {
      initEditor();
    }
  });
  
  function initEditor() {
    window.tinymce.init({
      target: editorContainer,
      height: height,
      skin: 'oxide-dark',
      content_css: 'dark',
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'media', 'table', 'help', 'wordcount'
      ],
      // toolbar: 'undo redo | blocks | ' +
      //   'bold italic backcolor | alignleft aligncenter ' +
      //   'alignright alignjustify | bullist numlist outdent indent | ' +
      //   'removeformat | help' + (showCreateNoteButton ? ' | createnote' : ''),
      toolbar: 'undo redo | blocks | fontselect fontsizeselect | ' +
        'bold italic backcolor | alignleft aligncenter ' +
        'alignright alignjustify | bullist numlist outdent indent | ' +
        'removeformat | help' + (showCreateNoteButton ? ' | createnote' : ''),

      font_family_formats: `
        Poppins=Poppins, sans-serif;
        Azonix=Azonix, sans-serif;
        KIONA=KIONA, sans-serif;
        Boldonse=Boldonse, sans-serif;
        Roboto=Roboto, sans-serif;
        Arial=arial,helvetica,sans-serif;
        Courier New=courier new,courier,monospace;
        Times New Roman=times new roman,times;
      `,


      images_upload_handler: async (blobInfo, progress) => {
        const formData = new FormData();
        formData.append('file', blobInfo.blob(), blobInfo.filename());
        
        try {
          const response = await fetch(uploadEndpoint, {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) throw new Error('Upload failed');
          
          const result = await response.json();
          return result.location; // Match your endpoint's response
        } catch (error) {
          console.error('Upload error:', error);
          return Promise.reject('Upload failed: ' + error.message);
        }
      },
    

      content_style: `
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
        @font-face {
          font-family: 'Azonix';
          src: url('/fonts/Azonix.otf') format('opentype');
        }
        @font-face {
          font-family: 'KIONA';
          src: url('/fonts/KIONA.ttf') format('truetype');
        }

        body {
          font-family: 'Poppins', 'Azonix', 'KIONA', sans-serif;
          font-size: 14px;
          background-color: #374151;
          color: #f9fafb;
        }

        .note-highlight {
          background-color: #CC7722;
          color: white;
          padding: 2px 4px;
          border-radius: 3px;
          position: relative;
        }
        .note-highlight::after {
          content: '📝';
          font-size: 12px;
          margin-left: 4px;
        }
      `
      ,
      setup: function (ed: any) {
        editor = ed;
        
        // Custom button for creating notes from highlights
        if (showCreateNoteButton) {
          ed.ui.registry.addButton('createnote', {
            text: 'Create Note',
            onAction: function () {
              const selection = ed.selection.getContent({format: 'text'});
              if (selection.trim()) {
                selectedText.set(selection);
                isCreatingNote.set(true);
              } else {
                alert('Please select some text first');
              }
            }
          });
        }
        
        ed.on('init', function () {
          ed.setContent(content);
        });
        
        ed.on('change keyup', function () {
          content = ed.getContent();
        });
      },
      readonly: disabled
    });
  }
  
  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });
  
  // Method to highlight text (called after creating note from selection)
  export function highlightText(text: string) {
    if (editor) {
      const currentContent = editor.getContent();
      const highlightedContent = currentContent.replace(
        new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        `<span class="note-highlight">${text}</span>`
      );
      editor.setContent(highlightedContent);
    }
  }
</script>

<div bind:this={editorContainer}></div>