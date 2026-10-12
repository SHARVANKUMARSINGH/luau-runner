import React, { useRef, useEffect, useCallback } from 'react';
import { EditorView } from '@codemirror/view';
import { syntaxHighlighting } from '@codemirror/language';
import { 
  createEditorState, 
  themeCompartment, 
  darkTheme, 
  lightTheme, 
  darkHighlightStyle, 
  lightHighlightStyle 
} from '../editor/setup';
import './CodeEditor.css';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  isDark: boolean;
  fontSize?: number;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  value, 
  onChange, 
  onRun, 
  isDark, 
  fontSize = 14 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const currentValueRef = useRef(value);

  const handleUpdate = useCallback(
    (content: string) => {
      currentValueRef.current = content;
      onChange(content);
    },
    [onChange]
  );

  // Initialize editor
  useEffect(() => {
    if (!editorRef.current) return;

    const state = createEditorState(value, isDark, handleUpdate, fontSize, onRun);
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update content when value changes externally (tab switching)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    if (value !== currentValueRef.current) {
      currentValueRef.current = value;
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value,
        },
      });
    }
  }, [value]);

  // Update theme
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: themeCompartment.reconfigure([
        isDark ? darkTheme : lightTheme,
        syntaxHighlighting(isDark ? darkHighlightStyle : lightHighlightStyle),
      ]),
    });
  }, [isDark]);

  // Update font size
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.style.setProperty('--editor-font-size', `${fontSize}px`);
    }
  }, [fontSize]);

  return (
    <div className="code-editor-container" ref={editorRef} />
  );
};

export default CodeEditor;
