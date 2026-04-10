import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import FontSize from 'tiptap-extension-font-size';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Link } from '@tiptap/extension-link';
import { Typography } from '@tiptap/extension-typography';
import { Image } from '@tiptap/extension-image';
import { Node, mergeAttributes } from '@tiptap/core';
import worshipService from '../../../api/worshipService';
import { 
    Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, 
    Highlighter, Save, MessageSquare, FileText, Upload, Presentation, Table as TableIcon, Palette, 
    Image as ImageIcon, Type, Quote, Heading1, Heading2, ChevronDown, Eye, Edit3, XCircle, Undo, Redo, Link as LinkIcon, 
    Eraser, CheckSquare, Subscript as SubIcon, Superscript as SuperIcon, Minus, Hash, PlusCircle, Layers,
    Maximize2, Minimize2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../../context/LanguageContext';
import * as mammoth from 'mammoth';
import JSZip from 'jszip';
import { renderAsync as renderDocx } from 'docx-preview';

// Custom Extension to handle Slide Blocks
const Slide = Node.create({
    name: 'slide',
    group: 'block',
    content: 'block+',
    defining: true,
    
    addAttributes() {
        return {
            id: { default: null },
            class: { default: 'pptx-slide-render' },
            style: { default: null },
            width: {
                default: '100%',
                parseHTML: element => element.style.width,
                renderHTML: attributes => ({ style: `width: ${attributes.width}` })
            },
            height: {
                default: 'auto',
                parseHTML: element => element.style.height,
                renderHTML: attributes => ({ style: `height: ${attributes.height}` })
            }
        };
    },

    parseHTML() {
        return [{
            tag: 'div',
            getAttrs: node => node.classList.contains('pptx-slide-render') && {
                id: node.getAttribute('id'),
                class: node.getAttribute('class'),
                style: node.getAttribute('style'),
                width: node.style.width,
                height: node.style.height,
            },
            contentElement: node => node.querySelector('.slide-content') || node, // Robust fallback for legacy content
        }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div', 
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 
            ['div', { class: 'slide-content', style: 'width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;' }, 0],
            ['div', { class: 'resizer-handle', style: 'position: absolute; bottom: 0; right: 0; width: 20px; height: 20px; cursor: nwse-resize; background: linear-gradient(135deg, transparent 50%, #D4AF37 50%); border-bottom-right-radius: 12px; z-index: 10;' }]
        ];
    },
});

const MenuBar = ({ editor, onStartComment, t }) => {
    const groupIntoSlide = useCallback(() => {
        if (!editor) return;
        const { from, to } = editor.state.selection;
        if (from === to) {
            toast.error("Veuillez sélectionner du texte ou des éléments à regrouper.");
            return;
        }
        
        const id = `slide-group-${Date.now()}`;
        const style = "margin: 3rem auto; background: linear-gradient(135deg, #111C44 0%, #050A1A 100%); color: white; padding: 4rem; border-radius: 1.5rem; text-align: center; border: 1px solid rgba(212,175,55,0.2); width: 100%; aspect-ratio: 16/9; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; box-shadow: 0 40px 100px rgba(0,0,0,0.5); overflow: hidden;";
        
        editor.chain().focus().wrapIn('slide', { id, style, class: 'pptx-slide-render' }).run();
        toast.success("Sélection groupée en Slide !");
    }, [editor]);

    const addSlide = useCallback(() => {
        if (!editor) return;
        const { from, to } = editor.state.selection;
        
        if (from !== to) {
            groupIntoSlide();
            return;
        }

        const title = window.prompt('Titre de la diapositive :', 'Nouveau Titre');
        if (title !== null) {
            const id = `slide-manual-${Date.now()}`;
            const style = "margin: 3rem auto; background: linear-gradient(135deg, #111C44 0%, #050A1A 100%); color: white; padding: 4rem; border-radius: 1.5rem; text-align: center; border: 1px solid rgba(212,175,55,0.2); width: 100%; aspect-ratio: 16/9; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; box-shadow: 0 40px 100px rgba(0,0,0,0.5); overflow: hidden;";
            
            editor.chain().focus().insertContent(`
                <div id="${id}" class="pptx-slide-render" style="${style}">
                    <div style="position: absolute; top: 20px; left: 40px; right: 40px; height: 1px; background: linear-gradient(to right, transparent, rgba(212,175,55,0.5), transparent);"></div>
                    <h2 style="color: #D4AF37; font-size: 3rem; margin: 0 0 2rem 0; text-transform: uppercase; font-weight: 900; line-height: 1.1; text-shadow: 0 4px 10px rgba(0,0,0,0.3);">${title}</h2>
                    <div style="width: 80%; height: 2px; background: rgba(212,175,55,0.1); margin-bottom: 2rem;"></div>
                    <ul style="text-align: left; display: inline-block; font-size: 1.6rem; color: #cbd5e1; margin: 0; padding-left: 2rem; line-height: 1.5; font-weight: 500;">
                        <li style="margin-bottom: 0.8rem;">Ajoutez vos points clés ici...</li>
                    </ul>
                    <div class="slide-footer" style="position: absolute; bottom: 20px; left: 40px; right: 40px; display: flex; justify-content: space-between; align-items: center; opacity: 0.3; font-size: 10px; font-weight: 800; letter-spacing: 2px;">
                        <span>LYON SYS 360</span>
                        <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.1); margin: 0 20px;"></div>
                        <span>© ${new Date().getFullYear()}</span>
                    </div>
                </div>
                <hr style="border: none; border-top: 1px dashed rgba(0,0,0,0.1); margin: 3rem 0;" />
            `).run();
        }
    }, [editor, groupIntoSlide]);

    const addImage = useCallback(() => {
        if (!editor) return;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            const file = input.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    editor.chain().focus().setImage({ src: e.target.result }).run();
                };
                reader.readAsDataURL(file);
            }
        };
        
        const option = window.confirm("Cliquez sur OK pour charger une image locale, ou Annuler pour utiliser une URL.");
        if (option) {
            input.click();
        } else {
            const url = window.prompt('URL de l\'image :');
            if (url) {
                editor.chain().focus().setImage({ src: url }).run();
            }
        }
    }, [editor]);

    const updateImageSize = useCallback((width) => {
        if (!editor) return;
        const attrs = editor.getAttributes('image');
        if (attrs.src) {
            editor.chain().focus().setImage({ ...attrs, width: `${width}%` }).run();
        }
    }, [editor]);

    const updateImageWrap = useCallback((mode) => {
        if (!editor) return;
        const attrs = editor.getAttributes('image');
        if (attrs.src) {
            let float = 'none';
            let display = 'block';
            let margin = '2rem auto';
            
            if (mode === 'left') { float = 'left'; display = 'inline'; margin = '0.5rem 1.5rem 0.5rem 0'; }
            if (mode === 'right') { float = 'right'; display = 'inline'; margin = '0.5rem 0 0.5rem 1.5rem'; }
            if (mode === 'center') { float = 'none'; display = 'block'; margin = '2rem auto'; }
            
            editor.chain().focus().setImage({ ...attrs, float, display, margin }).run();
        }
    }, [editor]);

    const setLink = useCallback(() => {
        if (!editor) return;
        const url = window.prompt('URL de destination :');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    }, [editor]);

    if (!editor) return null;

    const isActive = (type, options = {}) => editor.isActive(type, options);

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 sticky top-0 z-10 shrink-0">
            {/* History & Clipboard */}
            <div className="flex items-center bg-white dark:bg-white/5 rounded-lg p-0.5 shadow-sm border border-gray-100 dark:border-white/5">
                <button onClick={() => editor.chain().focus().undo().run()} className="p-1.5 text-gray-500 hover:text-brand-primary" title="Annuler"><Undo size={14} /></button>
                <button onClick={() => editor.chain().focus().redo().run()} className="p-1.5 text-gray-500 hover:text-brand-primary" title="Rétablir"><Redo size={14} /></button>
            </div>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

            {/* Basic Formatting Group */}
            <div className="flex items-center gap-0.5">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded-lg transition-colors ${isActive('bold') ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                    title={t('bold', 'Gras')}
                ><Bold size={16} /></button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded-lg transition-colors ${isActive('italic') ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                    title={t('italic', 'Italique')}
                ><Italic size={16} /></button>
                <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`p-2 rounded-lg transition-colors ${isActive('underline') ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                    title={t('underline', 'Souligné')}
                ><UnderlineIcon size={16} /></button>
                <button
                    onClick={() => editor.chain().focus().toggleMark('subscript').run()}
                    className={`p-2 rounded-lg ${isActive('subscript') ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    title="Indice"
                ><SubIcon size={14} /></button>
                <button
                    onClick={() => editor.chain().focus().toggleMark('superscript').run()}
                    className={`p-2 rounded-lg ${isActive('superscript') ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    title="Exposant"
                ><SuperIcon size={14} /></button>
            </div>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

            {/* Font Control Group */}
            <div className="flex items-center gap-1">
                <div className="relative">
                    <select 
                        onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                        className="appearance-none bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-gray-700 dark:text-gray-300 outline-none pr-8 cursor-pointer"
                        value={editor.getAttributes('textStyle').fontFamily || ''}
                    >
                        <option value="">Police</option>
                        <option value="Inter">Standard</option>
                        <option value="serif">Sérif</option>
                        <option value="monospace">Mono</option>
                    </select>
                    <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                </div>

                <div className="relative">
                    <select 
                        onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
                        className="appearance-none bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-black text-gray-700 dark:text-gray-300 outline-none pr-8 cursor-pointer"
                    >
                        <option value="">Taille</option>
                        <option value="12px">12</option>
                        <option value="16px">16</option>
                        <option value="20px">20</option>
                        <option value="32px">32</option>
                        <option value="48px">48</option>
                    </select>
                    <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                </div>
            </div>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

            {/* Paragraph Group */}
            <div className="flex items-center gap-0.5">
                <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-2 rounded-lg ${isActive({ textAlign: 'left' }) ? 'text-brand-primary' : 'text-gray-500'}`}><AlignLeft size={16} /></button>
                <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-2 rounded-lg ${isActive({ textAlign: 'center' }) ? 'text-brand-primary' : 'text-gray-500'}`}><AlignCenter size={16} /></button>
                <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`p-2 rounded-lg ${isActive({ textAlign: 'right' }) ? 'text-brand-primary' : 'text-gray-500'}`}><AlignRight size={16} /></button>
            </div>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

            {/* Lists & Tasks */}
            <div className="flex items-center gap-0.5">
                <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded-lg ${isActive('bulletList') ? 'text-brand-primary bg-brand-primary/10' : 'text-gray-500'}`}><List size={16} /></button>
                <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded-lg ${isActive('orderedList') ? 'text-brand-primary bg-brand-primary/10' : 'text-gray-500'}`}><ListOrdered size={16} /></button>
                <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={`p-2 rounded-lg ${isActive('taskList') ? 'text-brand-primary bg-brand-primary/10' : 'text-gray-500'}`} title="Liste de tâches"><CheckSquare size={16} /></button>
            </div>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

            {/* Insertions & Colors */}
            <div className="flex items-center gap-0.5">
                <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg" title="Tableau"><TableIcon size={16} /></button>
                <button onClick={setLink} className={`p-2 rounded-lg ${isActive('link') ? 'text-blue-500 bg-blue-50 focus:ring-0' : 'text-gray-500'}`} title="Lien"><LinkIcon size={16} /></button>
                <div className="flex items-center gap-1 bg-white/50 dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/10">
                    <input
                        type="color"
                        onInput={e => editor.chain().focus().setColor(e.target.value).run()}
                        value={editor.getAttributes('textStyle').color || '#D4AF37'}
                        className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer rounded-md overflow-hidden"
                        title={t('text_color', 'Couleur')}
                    />
                    <button
                        onClick={() => editor.chain().focus().unsetColor().run()}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Réinitialiser la couleur"
                    >
                        <Eraser size={14} />
                    </button>
                </div>
                <button
                    onClick={() => editor.chain().focus().toggleHighlight({ color: '#ffcc00' }).run()}
                    className={`p-2 rounded-lg ${isActive('highlight') ? 'bg-amber-400 text-white' : 'text-gray-500 hover:bg-amber-100'}`}
                ><Highlighter size={16} /></button>
            </div>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

            {/* Image Tools - Conditional */}
            {isActive('image') && (
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 p-1.5 rounded-lg border border-amber-200 dark:border-amber-500/20">
                    <span className="text-[9px] font-black uppercase text-amber-600 px-2 leading-none">Taille :</span>
                    <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        step="5"
                        defaultValue={editor.getAttributes('image').width ? parseInt(editor.getAttributes('image').width) : 100}
                        onChange={(e) => updateImageSize(e.target.value)}
                        className="w-20 h-1 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    
                    <div className="w-px h-4 bg-amber-200 mx-1"></div>
                    
                    <span className="text-[9px] font-black uppercase text-amber-600 px-2 leading-none">Habillage :</span>
                    <button onClick={() => updateImageWrap('left')} className={`p-1 rounded ${editor.getAttributes('image').float === 'left' ? 'bg-amber-500 text-white' : 'hover:bg-amber-200'}`} title="Encadré Gauche (Word)"><AlignLeft size={14} /></button>
                    <button onClick={() => updateImageWrap('center')} className={`p-1 rounded ${(editor.getAttributes('image').float === 'none' || !editor.getAttributes('image').float) ? 'bg-amber-500 text-white' : 'hover:bg-amber-200'}`} title="Aligné sur le texte"><AlignCenter size={14} /></button>
                    <button onClick={() => updateImageWrap('right')} className={`p-1 rounded ${editor.getAttributes('image').float === 'right' ? 'bg-amber-500 text-white' : 'hover:bg-amber-200'}`} title="Encadré Droite (Word)"><AlignRight size={14} /></button>
                </div>
            )}

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

            {/* Design & Structure */}
            <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-2 rounded-lg ${isActive('blockquote') ? 'text-brand-primary' : 'text-gray-500'}`} title="Citation"><Quote size={16} /></button>
            <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Ligne horizontale"><Minus size={16} /></button>
            <button onClick={addSlide} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg" title="Nouvelle Diapositive"><Presentation size={16} /></button>
            <button onClick={groupIntoSlide} className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg" title="Grouper en Slide"><Layers size={16} /></button>
            <button onClick={addImage} className="p-2 text-gray-500 hover:text-brand-primary rounded-lg hover:bg-gray-100" title="Insérer Image"><ImageIcon size={16} /></button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

            {/* Reset & Comments */}
            <button 
                onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} 
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg" 
                title="Effacer toute la mise en forme"
            ><Eraser size={16} /></button>
            
            <button
                onClick={() => {
                    const selection = editor.state.selection;
                    if (selection.empty) {
                        toast.error(t('select_text_to_comment', "Veuillez sélectionner du texte pour ajouter un commentaire."));
                        return;
                    }
                    const quote = editor.state.doc.textBetween(selection.from, selection.to, ' ');
                    editor.chain().focus().toggleHighlight({ color: '#cce5ff' }).run();
                    onStartComment(quote);
                }}
                className="p-2 rounded-lg bg-blue-500 text-white ml-auto shadow-md shadow-blue-500/20"
                title={t('add_comment', 'Commenter')}
            ><MessageSquare size={16} /></button>
        </div>
    );
};

const SermonEditor = ({ serviceId, initialData }) => {
    const { t } = useLanguage();
    const [title, setTitle] = useState(initialData?.title || '');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const previewContainerRef = useRef(null);
    const editorScrollRef = useRef(null);

    // Slide Navigation State
    const [slides, setSlides] = useState([]);
    const [activeSlideId, setActiveSlideId] = useState(null);

    // Comments State
    const [comments, setComments] = useState([]);
    const [showCommentForm, setShowCommentForm] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState('');
    const [newCommentText, setNewCommentText] = useState('');

    useEffect(() => {
        if (initialData?.id) {
            fetchComments();
        }
    }, [initialData?.id]);

    const fetchComments = async () => {
        try {
            const res = await worshipService.getComments(initialData.id);
            if (res.data) setComments(res.data);
        } catch (error) {
            console.error("No comments found or error fetching.");
        }
    };

    const editor = useEditor({
        extensions: [
            Slide,
            StarterKit.configure({
                history: true,
                bulletList: true,
                orderedList: true,
            }),
            Highlight.configure({ multicolor: true }),
            Underline.configure({}),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle.configure({}),
            Color.configure({}),
            FontFamily.configure({}),
            FontSize.configure({}),
            Subscript.configure({}),
            Superscript.configure({}),
            TaskList.configure({}),
            TaskItem.configure({ nested: true }),
            Link.configure({ openOnClick: false }),
            Typography.configure({}),
            Image.extend({
                draggable: true,
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        width: {
                            default: '100%',
                            renderHTML: attributes => ({ width: attributes.width }),
                        },
                        height: {
                            default: 'auto',
                            renderHTML: attributes => ({ height: attributes.height }),
                        },
                        float: {
                            default: 'none',
                            renderHTML: attributes => ({ 
                                style: `float: ${attributes.float || 'none'}; margin: ${attributes.margin || '2rem auto'}; display: ${attributes.display || 'block'}; max-width: 100%; height: auto; border-radius: 1rem; box-shadow: 0 10px 20px rgba(0,0,0,0.1); cursor: nwse-resize;` 
                            }),
                        },
                        display: { default: 'block' },
                        margin: { default: '2rem auto' },
                    };
                },
            }).configure({
                allowBase64: true,
            }),
            Table.configure({ resizable: true }),
            TableRow.configure({}),
            TableHeader.configure({}),
            TableCell.configure({}),
        ],
        content: initialData?.content || `<h3>${t('your_sermon_title', 'Titre de votre prédication')}</h3><p>${t('start_writing_message', 'Commencez à rédiger votre message ici...')}</p>`,
        editorProps: {
            attributes: {
                className: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[500px] p-8',
            },
            handlePaste: (view, event) => {
                // Special handling to keep more formatting on paste if possible
                return false; // let Tiptap handle it normally but with our extensions it'll keep more
            }
        },
    });

    // Mouse Driven Image Resizing
    useEffect(() => {
        if (!editor) return;
        let isResizing = false;
        let startX, startY, startWidth, startHeight;
        let targetImg = null;

        const handleMouseDown = (e) => {
            const isImage = e.target.tagName === 'IMG' && window.getComputedStyle(e.target).cursor === 'nwse-resize';
            const isSlideHandle = e.target.classList.contains('resizer-handle');
            const isSlide = isSlideHandle || (e.target.closest('.pptx-slide-render') && e.offsetX > e.target.offsetWidth - 20 && e.offsetY > e.target.offsetHeight - 20);
            
            if (isImage || isSlide) {
                isResizing = true;
                targetImg = isImage ? e.target : e.target.closest('.pptx-slide-render');
                startX = e.clientX;
                startY = e.clientY;
                startWidth = targetImg.offsetWidth;
                startHeight = targetImg.offsetHeight;
                e.preventDefault();
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            }
        };

        const handleMouseMove = (e) => {
            if (!isResizing || !targetImg || !targetImg.parentElement) return;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newWidth = Math.max(100, startWidth + deltaX);
            const parentWidth = targetImg.parentElement.offsetWidth || 1;
            const widthPercent = (newWidth / parentWidth) * 100;
            
            targetImg.style.width = targetImg.tagName === 'IMG' ? `${Math.min(100, widthPercent)}%` : `${newWidth}px`;
            
            if (targetImg.classList.contains('pptx-slide-render')) {
                const newHeight = Math.max(100, startHeight + deltaY);
                targetImg.style.height = `${newHeight}px`;
                targetImg.style.aspectRatio = 'auto'; // Break 16/9 if manually resizing
            }
        };

        const handleMouseUp = () => {
            if (isResizing && targetImg && editor) {
                const finalWidth = targetImg.style.width;
                const finalHeight = targetImg.style.height;
                
                if (targetImg.tagName === 'IMG') {
                    const attrs = editor.getAttributes('image');
                    editor.chain().focus().setImage({ ...attrs, width: finalWidth, height: finalHeight }).run();
                } else if (targetImg.classList.contains('pptx-slide-render')) {
                    // Force Tiptap to update the slide node attributes
                    editor.chain().focus().updateAttributes('slide', { width: finalWidth, height: finalHeight }).run();
                }
            }
            isResizing = false;
            targetImg = null;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        const dom = editor.view.dom;
        dom.addEventListener('mousedown', handleMouseDown);
        return () => dom.removeEventListener('mousedown', handleMouseDown);
    }, [editor]);

    // Deep sync slides with editor content
    useEffect(() => {
        if (!editor) return;
        const syncSlides = () => {
            const html = editor.getHTML();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const slideNodes = doc.querySelectorAll('.pptx-slide-render');
            const newList = Array.from(slideNodes).map((node, index) => ({
                id: node.id || `slide-${index}`,
                title: node.querySelector('h2')?.textContent || `Diapositive ${index + 1}`,
                num: index + 1
            }));
            setSlides(newList);
        };

        const detectActiveSlide = () => {
            const { from } = editor.state.selection;
            const node = editor.view.domAtPos(from).node;
            const element = node.nodeType === 3 ? node.parentElement : node;
            const slide = element?.closest('.pptx-slide-render');
            if (slide) setActiveSlideId(slide.id);
        };

        editor.on('update', syncSlides);
        editor.on('selectionUpdate', detectActiveSlide);
        syncSlides(); // Initial sync
        return () => {
            editor.off('update', syncSlides);
            editor.off('selectionUpdate', detectActiveSlide);
        };
    }, [editor]);

    // Auto-save debounced simulation conceptually
    const handleSave = async () => {
        if (!editor) return;
        setIsSaving(true);
        try {
            const htmlContent = editor.getHTML();
            await worshipService.upsertSermon(serviceId, {
                title: title,
                content: htmlContent,
                points: [], // Future implementation for structured points
            });
            setLastSaved(new Date());
            toast.success(t('message_saved', 'Message sauvegardé'));
        } catch (error) {
            toast.error(t('error_saving', 'Erreur lors de la sauvegarde'));
        } finally {
            setIsSaving(false);
        }
    };
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            toast.error(t('only_docx_supported', 'Seul le format Word (.docx) est supporté pour le moment.'));
            return;
        }

        toast.loading("Chargement haute fidélité...", { id: 'docx-load' });
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            const arrayBuffer = event.target.result;
            try {
                // Mammoth options for high-fidelity HTML conversion
                const options = {
                    styleMap: [
                        "p[style-name='Heading 1'] => h1:fresh",
                        "p[style-name='Heading 2'] => h2:fresh",
                        "p[style-name='Heading 3'] => h3:fresh",
                        "p[style-name='Title'] => h1.title:fresh",
                        "p[style-name='Subtitle'] => h2.subtitle:fresh",
                        "r[style-name='Emphasis'] => em",
                        "r[style-name='Strong'] => strong",
                        "u => u",
                        "strike => s",
                    ],
                    convertImage: mammoth.images.imgElement(function(image) {
                        return image.read("base64").then(function(imageBuffer) {
                            return { src: "data:" + image.contentType + ";base64," + imageBuffer };
                        });
                    }),
                    includeDefaultStyleMap: true,
                };

                const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer }, options);
                editor.commands.setContent(result.value);
                toast.success(t('import_success', 'Document importé avec fidélité !'), { id: 'docx-load' });
            } catch (err) {
                console.error('Error converting docx:', err);
                toast.error(t('import_error', "Erreur d'analyse."), { id: 'docx-load' });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handlePPTXUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const zip = await JSZip.loadAsync(event.target.result);
                
                // 1. Map all media in the PPTX
                const mediaFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/media/'));
                const imagesMap = {};
                for (const media of mediaFiles) {
                    const base64 = await zip.files[media].async("base64");
                    const ext = media.split('.').pop().toLowerCase();
                    imagesMap[media.replace('ppt/media/', '')] = `data:image/${ext};base64,${base64}`;
                }

                // 2. Identify all slides
                const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
                slideFiles.sort((a, b) => {
                    const numA = parseInt(a.replace('ppt/slides/slide', '').replace('.xml', ''));
                    const numB = parseInt(b.replace('ppt/slides/slide', '').replace('.xml', ''));
                    return numA - numB;
                });

                if (slideFiles.length === 0) {
                    toast.error("Format PowerPoint non reconnu.");
                    return;
                }

                toast.loading("Génération du Mode Lecture Haute Fidélité...", { id: 'pptx-load' });

                let fullContent = `<div class="pptx-perfect-fidelity" style="background: #000; padding: 60px 0;">`;
                const slideList = [];

                for (const slideFile of slideFiles) {
                    const slideXmlStr = await zip.files[slideFile].async("string");
                    const parser = new DOMParser();
                    const slideXml = parser.parseFromString(slideXmlStr, "text/xml");
                    
                    // Extract text
                    const textRuns = slideXml.getElementsByTagName("a:t");
                    let slideText = "";
                    for (let i = 0; i < textRuns.length; i++) {
                        slideText += textRuns[i].textContent + " ";
                    }

                    // Extract Image references for this slide
                    const relsFile = slideFile.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
                    let slideImagesHtml = "";
                    if (zip.files[relsFile]) {
                        const relsXmlStr = await zip.files[relsFile].async("string");
                        const relsXml = parser.parseFromString(relsXmlStr, "text/xml");
                        const relationships = relsXml.getElementsByTagName("Relationship");
                        
                        for (let i = 0; i < relationships.length; i++) {
                            const target = relationships[i].getAttribute("Target");
                            const type = relationships[i].getAttribute("Type");
                            if (type.includes("image")) {
                                const mediaName = target.replace('../media/', '');
                                if (imagesMap[mediaName]) {
                                    slideImagesHtml += `<img src="${imagesMap[mediaName]}" style="max-height: 250px; border-radius: 8px; box-shadow: 0 10px 20px rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.1); margin: 10px;" />`;
                                }
                            }
                        }
                    }

                    const slideNum = slideFile.replace('ppt/slides/slide', '').replace('.xml', '');
                    const slideId = `slide-${slideNum}`;
                    const slideTitle = slideText.trim().substring(0, 30) || `Slide ${slideNum}`;
                    
                    slideList.push({ id: slideId, title: slideTitle, num: slideNum });
                    
                    fullContent += `
                        <div id="${slideId}" class="pptx-slide-render" style="width: 29.7cm; aspect-ratio: 16/9; background: #1e293b; margin: 0 auto 80px auto; position: relative; box-shadow: 0 40px 100px rgba(0,0,0,0.8); overflow: hidden; display: flex; flex-direction: column; justify-content: center; align-items: center; background-image: radial-gradient(circle at 10% 10%, rgba(212,175,55,0.1) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(212,175,55,0.05) 0%, transparent 40%);">
                            <div style="position: absolute; top: 30px; left: 50px; display: flex; align-items: center; gap: 15px;">
                                <div style="width: 30px; height: 2px; background: #D4AF37;"></div>
                                <span style="color: #D4AF37; font-size: 10px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase;">DIAPOSITIVE ${slideNum}</span>
                            </div>
                            
                            <div style="width: 100%; padding: 40px 100px; display: flex; flex-direction: column; gap: 40px; align-items: center; text-align: center;">
                                ${slideText.trim() ? `<h2 style="color: #fff; font-size: 2.5rem; font-weight: 800; line-height: 1.1; margin: 0; text-shadow: 0 4px 20px rgba(0,0,0,0.5);">${slideText.trim().substring(0, 150)}${slideText.length > 150 ? '...' : ''}</h2>` : ''}
                                
                                <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; width: 100%;">
                                    ${slideImagesHtml || (slideText.trim() ? '' : '<div style="color: rgba(255,255,255,0.1); font-size: 100px; opacity: 0.2;">👁</div>')}
                                </div>
                            </div>

                            <div style="position: absolute; bottom: 30px; left: 50px; right: 50px; display: flex; justify-content: space-between; align-items: center; opacity: 0.3;">
                                <span style="color: #fff; font-size: 9px; font-weight: bold; letter-spacing: 2px;">SIAAH POWERPOINT SYSTEM</span>
                                <div style="height: 1px; flex: 1; margin: 0 20px; background: linear-gradient(to right, transparent, #D4AF37, transparent);"></div>
                                <span style="color: #fff; font-size: 9px; font-weight: bold; letter-spacing: 2px;">© ${new Date().getFullYear()}</span>
                            </div>
                        </div>
                    `;
                }

                fullContent += `</div>`;
                setSlides(slideList);
                editor.commands.setContent(fullContent);
                toast.success('Rendu PowerPoint parfaitement intact !', { id: 'pptx-load' });
            } catch (err) {
                console.error('Error parsing PPTX:', err);
                toast.error("Échec du rendu Haute Fidélité.", { id: 'pptx-load' });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const scrollToSlide = (id) => {
        const element = document.getElementById(id);
        if (element && editorScrollRef.current) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add a brief highlight effect
            element.style.outline = '4px solid #D4AF37';
            setTimeout(() => { element.style.outline = 'none'; }, 2000);
        }
    };

    const deleteSlide = (id) => {
        if (!editor) return;
        if (window.confirm('Voulez-vous supprimer cette diapositive ?')) {
            const currentHtml = editor.getHTML();
            const parser = new DOMParser();
            const doc = parser.parseFromString(currentHtml, 'text/html');
            const target = doc.getElementById(id);
            if (target) {
                target.remove();
                editor.commands.setContent(doc.body.innerHTML);
            }
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 h-full p-2">
            {/* Slide Navigation Sidebar */}
            <div className="w-64 flex flex-col bg-white dark:bg-[#111C44] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl shrink-0">
                <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Presentation size={16} className="text-brand-primary" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Plan des Slides</h3>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto noscrollbar p-2 space-y-2">
                    {slides.length === 0 && (
                        <p className="text-[10px] text-gray-400 text-center py-10 italic">Aucune slide détectée.</p>
                    )}
                    {slides.map((s) => (
                        <div key={s.id} className="relative group">
                            <button
                                onClick={() => { scrollToSlide(s.id); setActiveSlideId(s.id); }}
                                className={`w-full text-left p-3 rounded-xl transition-all border ${activeSlideId === s.id ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30' : 'hover:bg-brand-primary/10 border-transparent hover:border-brand-primary/20'}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-[10px] font-black uppercase ${activeSlideId === s.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-brand-primary'}`}>DIAPOSITIVE {s.num}</span>
                                    {activeSlideId === s.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>}
                                </div>
                                <div className={`text-[11px] font-bold line-clamp-2 leading-relaxed pr-6 ${activeSlideId === s.id ? 'text-indigo-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {s.title}
                                </div>
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteSlide(s.id); }}
                                className="absolute right-2 top-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Supprimer"
                            >
                                <XCircle size={14} />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="p-3 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5">
                    <button 
                        onClick={() => {
                            // Find MenuBar's addSlide logic by simulating or calling a prop if we moved it
                            // For simplicity, let's just trigger a click on the toolbar button or use a local handler
                            const title = window.prompt('Titre de la diapositive :', 'Nouvelle Diapositive');
                            if (title !== null) {
                                const id = `slide-manual-${Date.now()}`;
                                const style = "margin: 2rem auto; background: #111C44; color: white; padding: 2rem; border-radius: 1rem; text-align: center; border: 1px solid rgba(212,175,55,0.3); width: 100%; aspect-ratio: 16/9; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; box-shadow: 0 20px 50px rgba(0,0,0,0.3); font-size: 1.2rem;";
                                editor.chain().focus().insertContent(`
                                    <div id="${id}" class="pptx-slide-render" style="${style}">
                                        <h2 style="color: #D4AF37; font-size: 2.2rem; margin: 0 0 0.8rem 0; text-transform: uppercase; font-weight: 900; line-height: 1.1;">${title}</h2>
                                        <ul style="text-align: left; display: inline-block; font-size: 1.3rem; color: #cbd5e1; margin: 0; padding-left: 2rem; line-height: 1.4;">
                                            <li style="margin-bottom: 0.3rem;">Nouveau point important...</li>
                                        </ul>
                                    </div>
                                    <hr style="border: none; border-top: 1px dashed rgba(0,0,0,0.1); margin: 2rem 0;" />
                                `).run();
                                setTimeout(() => scrollToSlide(id), 100);
                            }
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20"
                    >
                        <PlusCircle size={14} /> Nouveau Slide
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-[#111C44] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/5 shrink-0">
                    <div className="flex items-center gap-6">
                        <input 
                            type="text" 
                            placeholder={t('sermon_title_placeholder', "Titre global de la prédication...")}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-transparent border-none text-xl font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0 w-64"
                        />
                        <div className="flex items-center gap-2 px-3 py-1 bg-brand-primary/10 rounded-full border border-brand-primary/20">
                            <Edit3 size={12} className="text-brand-primary" />
                            <span className="text-[10px] font-black uppercase tracking-tighter text-brand-primary">Mode Visualisation & Édition</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {lastSaved && <span className="text-xs text-gray-400 font-medium">{t('saved_at', 'Sauvegardé à')} {lastSaved.toLocaleTimeString()}</span>}
                        <div className="flex items-center gap-2">
                            <input 
                                type="file" 
                                id="docx-upload" 
                                accept=".docx" 
                                onChange={handleFileUpload} 
                                className="hidden" 
                            />
                            <button 
                                onClick={() => document.getElementById('docx-upload').click()}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all border border-blue-200 dark:border-blue-500/20"
                                title={t('import_word', 'Importer Word')}
                            >
                                <FileText size={14} /> <span>Word</span>
                            </button>

                            <input 
                                type="file" 
                                id="pptx-upload" 
                                accept=".pptx" 
                                onChange={handlePPTXUpload} 
                                className="hidden" 
                            />
                            <button 
                                onClick={() => document.getElementById('pptx-upload').click()}
                                className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-bold hover:bg-orange-100 transition-all border border-orange-200 dark:border-orange-500/20"
                                title={t('import_pptx', 'Importer PowerPoint')}
                            >
                                <Presentation size={14} /> <span>PPTX</span>
                            </button>
                        </div>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-primary/30 hover:translate-y-[-2px] transition-all disabled:opacity-50"
                        >
                            <Save size={16} /> {isSaving ? t('saving', 'Enregistrement...') : t('save', 'Enregistrer')}
                        </button>
                    </div>
                </div>

                <MenuBar t={t} editor={editor} onStartComment={(quote) => {
                    setSelectedQuote(quote);
                    setShowCommentForm(true);
                }} />
                
                <style>{`
                    .ProseMirror {
                        min-height: 29.7cm;
                        padding: 3cm 2.5cm !important;
                        background: white !important;
                        color: #1a1a1a !important;
                        box-shadow: 0 0 50px rgba(0,0,0,0.15);
                        margin: 40px auto !important;
                        width: 21cm;
                        border-radius: 4px;
                    }
                    .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
                        color: #1a1a1a !important;
                        margin-bottom: 0.8em;
                    }
                    .ProseMirror p {
                        line-height: 1.6;
                        margin-bottom: 1em;
                        color: #333 !important;
                    }
                    .ProseMirror ul, .ProseMirror ol {
                        padding-left: 1.5rem;
                        margin-bottom: 1em;
                    }
                    .ProseMirror blockquote {
                        border-left: 4px solid #D4AF37;
                        padding-left: 1.5rem;
                        font-style: italic;
                        color: #666;
                        margin: 1.5em 0;
                    }
                    .ProseMirror [data-type="taskList"] {
                        list-style: none;
                        padding: 0;
                    }
                    .ProseMirror [data-type="taskItem"] {
                        display: flex;
                        align-items: flex-start;
                        gap: 10px;
                        margin-bottom: 0.5em;
                    }
                    .ProseMirror [data-type="taskItem"] > label {
                        flex: 0 0 auto;
                        user-select: none;
                        margin-top: 4px;
                    }
                    .ProseMirror [data-type="taskItem"] > div {
                        flex: 1 1 auto;
                    }
                    .ProseMirror img {
                        max-width: 100%;
                        height: auto;
                        border-radius: 4px;
                    }
                    .dark .ProseMirror {
                        /* Keep white background for document fidelity even in dark mode */
                        background: white !important; 
                        color: #1a1a1a !important;
                    }
                    .editor-container-scroll {
                        background: #f1f5f9;
                    }
                    .dark .editor-container-scroll {
                        background: #0f172a;
                    }
                    .ProseMirror .pptx-slide-render {
                        background: white !important;
                        color: #1e293b !important;
                        border: 1px solid #e2e8f0 !important;
                        padding: 1.5rem !important;
                        width: 100% !important;
                        aspect-ratio: auto !important;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05) !important;
                        border-radius: 12px !important;
                        transform: none !important;
                        margin: 1rem 0 !important;
                        position: relative !important;
                        cursor: nwse-resize !important;
                    }
                    .ProseMirror .pptx-slide-render::after {
                        content: '';
                        position: absolute;
                        bottom: 0;
                        right: 0;
                        width: 15px;
                        height: 15px;
                        background: linear-gradient(135deg, transparent 50%, #cbd5e1 50%);
                        border-bottom-right-radius: 12px;
                        cursor: nwse-resize;
                    }
                    .ProseMirror .pptx-slide-render h2 { color: #D4AF37 !important; font-size: 1.4rem !important; margin: 0 0 0.5rem 0 !important; font-weight: 800 !important; }
                    .ProseMirror .pptx-slide-render ul { color: #475569 !important; font-size: 1rem !important; margin: 0 !important; padding-left: 2rem !important; line-height: 1.4 !important; }
                    .ProseMirror .pptx-slide-render li { margin-bottom: 0.2rem !important; }
                    .ProseMirror .pptx-slide-render * { position: static !important; opacity: 1 !important; visibility: visible !important; }
                    /* Show Slide Metadata Footer only in Projection or as very small text in editor */
                    .ProseMirror .pptx-slide-render .slide-footer { display: none !important; }
                    
                    /* Manual Image Resize Handle */
                    .ProseMirror img {
                        transition: box-shadow 0.2s;
                        border: 2px solid transparent;
                    }
                    .ProseMirror img.ProseMirror-selectednode {
                        outline: none;
                        border-color: #D4AF37;
                        box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.2);
                    }
                `}</style>
                
                <div 
                    ref={editorScrollRef}
                    className="flex-1 overflow-y-auto noscrollbar cursor-text editor-container-scroll"
                >
                    <EditorContent editor={editor} />
                </div>
            </div>

            {/* Collaboration Sidebar */}
            <div className="w-full md:w-80 bg-gray-50/80 dark:bg-[#0B0F19] rounded-2xl border border-gray-200 dark:border-white/10 p-5 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">{t('comments', 'Commentaires')}</h3>
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">{comments.length}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto noscrollbar pr-2 space-y-4">
                    {showCommentForm && (
                        <div className="bg-white dark:bg-[#111C44] p-4 rounded-2xl border border-blue-200 dark:border-blue-900/30 shadow-md animate-in slide-in-from-right-4">
                            <h4 className="text-xs font-bold text-blue-600 uppercase mb-2">Nouveau commentaire</h4>
                            <div className="pl-3 border-l-2 border-blue-400 mb-3 text-sm text-gray-600 dark:text-gray-300 italic h-auto">
                                "{selectedQuote.length > 80 ? selectedQuote.substring(0, 80) + '...' : selectedQuote}"
                            </div>
                            <textarea 
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                placeholder="Votre remarque ou question..."
                                className="w-full bg-gray-50 dark:bg-white/5 border-transparent outline-none p-3 rounded-xl text-sm mb-3 min-h-[80px]"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => { setShowCommentForm(false); setNewCommentText(''); }}
                                    className="px-3 py-1.5 flex-1 text-xs font-bold text-gray-500 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 transition-colors"
                                >Annuler</button>
                                <button 
                                    onClick={async () => {
                                        if (!newCommentText.trim()) return;
                                        if (!initialData?.id) {
                                            toast.error("Veuillez d'abord enregistrer le brouillon du message.");
                                            return;
                                        }
                                        try {
                                            const payload = {
                                                sermonMessageId: initialData.id,
                                                content: `> ${selectedQuote}\n\n${newCommentText}`
                                            };
                                            const res = await worshipService.addComment(payload);
                                            setComments([res.data.comment, ...comments]);
                                            setShowCommentForm(false);
                                            setNewCommentText('');
                                            toast.success("Commentaire ajouté");
                                        } catch (error) {
                                            toast.error("Erreur lors de l'envoi");
                                        }
                                    }}
                                    className="px-3 py-1.5 flex-1 text-xs font-bold text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 transition-colors"
                                >Publier</button>
                            </div>
                        </div>
                    )}

                    {comments.length === 0 && !showCommentForm ? (
                        <div className="flex flex-col items-center justify-center text-center py-10 opacity-50">
                            <MessageSquare size={32} className="mb-4" />
                            <p className="text-sm font-medium">Aucun commentaire pour le moment.</p>
                        </div>
                    ) : (
                        comments.map(c => (
                            <div key={c.id} className="bg-white dark:bg-[#111C44] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-xs font-bold">
                                        {c.author?.firstName?.charAt(0) || 'U'}
                                    </div>
                                    <span className="text-xs font-bold">{c.author?.firstName || 'Utilisateur'}</span>
                                    <span className="text-[10px] text-gray-400 ml-auto">{new Date(c.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-pre-wrap">
                                    {c.content.split('\n\n').map((part, i) => 
                                        part.startsWith('> ') 
                                            ? <div key={i} className="pl-2 border-l-2 border-brand-primary/50 text-gray-500 italic mb-2 text-xs">{part.replace('> ', '')}</div>
                                            : <p key={i}>{part}</p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SermonEditor;
