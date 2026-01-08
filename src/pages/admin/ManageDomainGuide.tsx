import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Save, Edit, BookOpen } from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, orderBy, query, limit } from 'firebase/firestore';
import { highlightQuestionsInHTML } from '../../utils/questionHighlighter';
import { useParams, Link } from 'react-router-dom';

export default function ManageDomainGuide() {
    const { domain } = useParams();
    const [content, setContent] = useState<any>(null);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        video_url: '',
    });

    // Map URL param to Collection Name
    const getCollectionName = (domainName: string | undefined) => {
        if (domainName === 'B.Com') return 'prompt_engineering_guide_bcom';
        if (domainName === 'BBA') return 'prompt_engineering_guide_bba';
        if (domainName === 'Civil Engineer') return 'prompt_engineering_guide_civil';
        return null;
    };

    const collectionName = getCollectionName(domain);

    useEffect(() => {
        if (collectionName) {
            fetchContent();
        }
    }, [collectionName]);

    async function fetchContent() {
        if (!collectionName) return;
        try {
            const contentQuery = query(collection(db, collectionName), orderBy('created_at', 'desc'), limit(1));
            const contentSnapshot = await getDocs(contentQuery);

            if (!contentSnapshot.empty) {
                const data = contentSnapshot.docs[0].data();
                setContent({
                    ...data,
                    id: contentSnapshot.docs[0].id,
                });
            } else {
                setContent(null); // Reset if new domain has no content
            }
        } catch (error) {
            console.error('Error fetching content:', error);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!collectionName) return;

        try {
            if (isEditing && content) {
                // Update existing content
                await updateDoc(doc(db, collectionName, content.id), {
                    ...formData,
                    updated_at: new Date().toISOString(),
                });
                setIsEditing(false);
            } else {
                // Add new content
                await addDoc(collection(db, collectionName), {
                    ...formData,
                    created_at: new Date().toISOString(),
                });
            }
            setFormData({ title: '', content: '', video_url: '' });
            setShowForm(false);
            fetchContent();
        } catch (error) {
            console.error('Error saving content:', error);
        }
    }

    function editContent() {
        if (content) {
            setFormData({
                title: content.title || '',
                content: content.content || '',
                video_url: content.video_url || '',
            });
            setIsEditing(true);
            setShowForm(true);
        }
    }

    function cancelEdit() {
        setIsEditing(false);
        setFormData({ title: '', content: '', video_url: '' });
        setShowForm(false);
    }

    if (!collectionName) {
        return (
            <div className="p-8 text-center text-gray-500">
                Invalid Domain specified.
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
            >
                <Card variant="premium" className="overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Link to="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
                                    Dashboard
                                </Link>
                                <span className="text-gray-300">/</span>
                                <span className="text-warm-brown font-medium">Guide Manager</span>
                            </div>
                            <h1 className="text-4xl font-bold text-warm-brown mb-3">Manage Guide: {domain}</h1>
                            <p className="text-text-secondary text-lg mb-4">Create and manage prompt engineering content for {domain} students.</p>

                            <div className="flex items-center gap-6 text-sm text-text-secondary">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-warm-brown" />
                                    <span>{domain} Curriculum</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Save className="w-4 h-4 text-success" />
                                    <span>Auto Save</span>
                                </div>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                if (content) editContent();
                                else setShowForm(!showForm);
                            }}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            {content ? 'Edit Content' : 'Add Content'}
                        </motion.button>
                    </div>
                </Card>
            </motion.div>

            {/* Content Preview */}
            {content && !showForm && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card variant="premium">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-text-primary mb-2">{content.title}</h2>
                                <p className="text-sm text-text-secondary mb-4">
                                    Last updated: {content.updated_at ? new Date(content.updated_at).toLocaleDateString() : new Date(content.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={editContent}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                Edit Content
                            </motion.button>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                            <div
                                className="prose max-w-none text-text-primary leading-relaxed"
                                dangerouslySetInnerHTML={{
                                    __html: highlightQuestionsInHTML(content.content?.replace(/\n/g, '<br>') || 'No content available')
                                }}
                            />
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Content Form */}
            {showForm && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card variant="premium">
                        <h3 className="text-xl font-bold text-text-primary mb-4">
                            {isEditing ? `Edit Guide for ${domain}` : `Add Guide for ${domain}`}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-text-secondary mb-2">Guide Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-warm-brown focus:ring-2 focus:ring-warm-brown/20"
                                    placeholder={`e.g., Prompt Engineering Basics for ${domain}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-text-secondary mb-2">Content</label>
                                <textarea
                                    required
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-warm-brown focus:ring-2 focus:ring-warm-brown/20"
                                    rows={15}
                                    placeholder="Enter your content here. Supports HTML formatting..."
                                />
                                <p className="text-xs text-text-secondary mt-1">
                                    Supports HTML formatting: headings (&lt;h2&gt;), paragraphs (&lt;p&gt;), lists, etc.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm text-text-secondary mb-2">Video URL (Optional)</label>
                                <input
                                    type="url"
                                    value={formData.video_url}
                                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-warm-brown focus:ring-2 focus:ring-warm-brown/20"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                />
                            </div>
                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="submit"
                                    className="btn-primary"
                                >
                                    {isEditing ? 'Update Content' : 'Save Content'}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="button"
                                    onClick={cancelEdit}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </motion.button>
                            </div>
                        </form>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
