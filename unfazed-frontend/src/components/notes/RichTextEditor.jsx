import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  RemoveFormatting,
} from 'lucide-react';

export const RichTextEditor = ({ content = '', onChange, placeholder = 'Write clinical documentation...' }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[160px] p-3.5 focus:outline-none text-xs leading-relaxed text-slate-800',
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ onClick, isActive, icon: Icon, title }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded-lg text-xs transition-colors flex items-center justify-center ${
        isActive
          ? 'bg-teal-100 text-teal-900 font-bold'
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
      }`}
      title={title}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs focus-within:ring-1 focus-within:ring-teal-700 focus-within:border-teal-700 transition-all">
      {/* TipTap Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 text-slate-600">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={Bold}
          title="Bold"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={Italic}
          title="Italic"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          icon={Strikethrough}
          title="Strikethrough"
        />

        <div className="w-[1px] h-4 bg-slate-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          icon={Heading2}
          title="Heading 2"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          icon={Heading3}
          title="Heading 3"
        />

        <div className="w-[1px] h-4 bg-slate-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={List}
          title="Bullet List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon={ListOrdered}
          title="Numbered List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          icon={Quote}
          title="Blockquote"
        />

        <div className="w-[1px] h-4 bg-slate-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          isActive={false}
          icon={RemoveFormatting}
          title="Clear Formatting"
        />

        <div className="flex-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          isActive={false}
          icon={Undo2}
          title="Undo"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          isActive={false}
          icon={Redo2}
          title="Redo"
        />
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
