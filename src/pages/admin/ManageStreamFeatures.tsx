import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    Plus,
    Save,
    Edit,
    BookOpen,
    Layers,
    ArrowLeft,
    FileText,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    limit,
    serverTimestamp,
    orderBy
} from 'firebase/firestore';
import { highlightQuestionsInHTML } from '../../utils/questionHighlighter';
import { Link } from 'react-router-dom';

interface Stream {
    id: string;
    name: string;
}

interface Feature {
    id: string;
    name: string;
}

interface Content {
    id?: string;
    title: string;
    content: string;
    video_url?: string;
    updated_at?: any;
}

export default function ManageStreamFeatures() {
    const [streams, setStreams] = useState<Stream[]>([]);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
    const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
    const [content, setContent] = useState<Content | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        video_url: '',
    });

    // Helper to determine collection name (supports legacy guide collections)
    const getCollectionName = (streamId: string, featureId: string) => {
        const sId = streamId.toLowerCase();
        const fId = featureId.toLowerCase();

        if (fId === 'guide') {
            if (sId === 'bcom' || sId === 'b.com') return 'prompt_engineering_guide_bcom';
            if (sId === 'bba') return 'prompt_engineering_guide_bba';
            if (sId === 'civil' || sId.includes('civil')) return 'prompt_engineering_guide_civil';
        }
        return 'stream_content';
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    async function fetchInitialData() {
        let streamsList: Stream[] = [];
        let featuresList: Feature[] = [];

        try {
            setLoading(true);
            // Fetch Streams and Features in parallel
            const [streamsSnap, featuresSnap] = await Promise.all([
                getDocs(collection(db, 'streams')),
                getDocs(collection(db, 'features'))
            ]);

            streamsList = streamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Stream));
            featuresList = featuresSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feature));
        } catch (error) {
            console.error('Error fetching initial data (using fallback):', error);
        } finally {
            // Fallback if collections are empty or fetch failed
            if (streamsList.length === 0) {
                streamsList = [
                    { id: 'bcom', name: 'B.Com' },
                    { id: 'bba', name: 'BBA' },
                    { id: 'civil', name: 'Civil Engineer' }
                ];
            }
            if (featuresList.length === 0) {
                featuresList = [
                    { id: 'guide', name: 'Prompt Engineering Guide' }
                ];
            }

            setStreams(streamsList);
            setFeatures(featuresList);
            setLoading(false);
        }
    }

    useEffect(() => {
        if (selectedStream && selectedFeature) {
            fetchContent();
        } else {
            setContent(null);
            setIsEditing(false);
        }
    }, [selectedStream, selectedFeature]);

    async function fetchContent() {
        if (!selectedStream || !selectedFeature) return;

        try {
            setLoading(true);
            const collectionName = getCollectionName(selectedStream.id, selectedFeature.id);

            let contentQuery;
            if (collectionName === 'stream_content') {
                contentQuery = query(
                    collection(db, collectionName),
                    where('streamId', '==', selectedStream.id),
                    where('featureId', '==', selectedFeature.id),
                    limit(1)
                );
            } else {
                // Legacy collections just have one doc per stream
                contentQuery = query(
                    collection(db, collectionName),
                    orderBy('created_at', 'desc'),
                    limit(1)
                );
            }

            let snap = await getDocs(contentQuery);

            // Fallback: If no results with orderBy, try without it (for items missing created_at)
            if (snap.empty && collectionName !== 'stream_content') {
                const fallbackQuery = query(collection(db, collectionName), limit(1));
                snap = await getDocs(fallbackQuery);
            }

            if (!snap.empty) {
                const docData = snap.docs[0].data();
                const data = {
                    id: snap.docs[0].id,
                    title: docData.title || '',
                    content: docData.content || '',
                    video_url: docData.video_url || '',
                    updated_at: docData.updated_at
                };
                setContent(data);
                setFormData({
                    title: data.title,
                    content: data.content,
                    video_url: data.video_url
                });
            } else {
                setContent(null);
                setFormData({ title: '', content: '', video_url: '' });
            }
        } catch (error) {
            console.error('Error fetching content:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedStream || !selectedFeature) return;

        setSaving(true);
        const collectionName = getCollectionName(selectedStream.id, selectedFeature.id);

        try {
            if (content?.id) {
                // Update
                await updateDoc(doc(db, collectionName, content.id), {
                    ...formData,
                    updated_at: serverTimestamp()
                });
            } else {
                // Add
                const payload: any = {
                    ...formData,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                };

                // Only nested collection needs the mapping IDs
                if (collectionName === 'stream_content') {
                    payload.streamId = selectedStream.id;
                    payload.featureId = selectedFeature.id;
                }

                const newDoc = await addDoc(collection(db, collectionName), payload);
                setContent({ ...formData, id: newDoc.id });
            }
            setIsEditing(false);
            // Refetch to get formatted dates/fields if needed
            fetchContent();
        } catch (error) {
            console.error('Error saving content:', error);
        } finally {
            setSaving(false);
        }
    }

    const goBackToStreams = () => {
        setSelectedStream(null);
        setSelectedFeature(null);
    };

    const goBackToFeatures = () => {
        setSelectedFeature(null);
    };

    if (loading && streams.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-10 h-10 border-4 border-warm-brown border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Card */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Card variant="premium" className="overflow-hidden">
                    <div className="flex items-center gap-4 mb-2">
                        <Link to="/admin" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">Dashboard</Link>
                        {selectedStream && (
                            <>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                                <button onClick={goBackToStreams} className="text-gray-400 hover:text-gray-600 transition-colors text-sm">Streams</button>
                            </>
                        )}
                        {selectedFeature && (
                            <>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                                <button onClick={goBackToFeatures} className="text-warm-brown font-medium text-sm">{selectedStream?.name}</button>
                            </>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-warm-brown mb-2">
                                {!selectedStream ? 'Select a Stream' : !selectedFeature ? `Features: ${selectedStream.name}` : selectedFeature.name}
                            </h1>
                            <p className="text-text-secondary">
                                {!selectedStream
                                    ? 'Manage content by selecting a professional stream.'
                                    : !selectedFeature
                                        ? `Explore and manage features specifically for ${selectedStream.name}.`
                                        : `Update content for ${selectedFeature.name} under ${selectedStream.name}.`}
                            </p>
                        </div>
                        {(selectedStream || selectedFeature) && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={selectedFeature ? goBackToFeatures : goBackToStreams}
                                className="p-3 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors"
                                title="Go Back"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </motion.button>
                        )}
                    </div>
                </Card>
            </motion.div>

            <AnimatePresence mode="wait">
                {/* VIEW 1: STREAM SELECTION */}
                {!selectedStream && (
                    <motion.div
                        key="streams"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {streams.map((stream) => (
                            <motion.div
                                key={stream.id}
                                whileHover={{ y: -5 }}
                                onClick={() => setSelectedStream(stream)}
                                className="cursor-pointer"
                            >
                                <Card className="h-full hover:shadow-hover transition-all duration-300 border-2 border-transparent hover:border-warm-brown/20 group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-warm-brown/10 rounded-xl flex items-center justify-center group-hover:bg-warm-brown group-hover:text-white transition-colors text-warm-brown">
                                            <Layers className="w-6 h-6" />
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-warm-brown transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-bold text-text-primary mb-2">{stream.name}</h3>
                                    <p className="text-sm text-text-secondary">Manage curriculum and resources for {stream.name}.</p>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* VIEW 2: FEATURE SELECTION */}
                {selectedStream && !selectedFeature && (
                    <motion.div
                        key="features"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {features.map((feature) => (
                            <motion.div
                                key={feature.id}
                                whileHover={{ y: -5 }}
                                onClick={() => setSelectedFeature(feature)}
                                className="cursor-pointer"
                            >
                                <Card className="h-full hover:shadow-hover transition-all duration-300 border-2 border-transparent hover:border-warm-brown/20 group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-warm-brown/10 rounded-xl flex items-center justify-center group-hover:bg-warm-brown group-hover:text-white transition-colors text-warm-brown">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-warm-brown transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-bold text-text-primary mb-2">{feature.name}</h3>
                                    <p className="text-sm text-text-secondary">Configure tools and guides for students.</p>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* VIEW 3: CONTENT MANAGEMENT */}
                {selectedStream && selectedFeature && (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Action Bar */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-warm-brown/10 text-warm-brown rounded-full text-xs font-bold uppercase tracking-wider">
                                    {selectedStream.name}
                                </span>
                                <span className="text-gray-300">/</span>
                                <span className="text-text-primary font-medium">{selectedFeature.name}</span>
                            </div>

                            {!isEditing && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsEditing(true)}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {content ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    {content ? 'Update Content' : 'Add Content'}
                                </motion.button>
                            )}
                        </div>

                        {/* Content Display or Editor */}
                        {!isEditing ? (
                            content ? (
                                <Card variant="premium">
                                    <div className="mb-6">
                                        <h2 className="text-2xl font-bold text-text-primary mb-2">{content.title}</h2>
                                        {content.updated_at && (
                                            <p className="text-xs text-text-secondary uppercase tracking-widest font-semibold flex items-center gap-2">
                                                <CheckCircle2 className="w-3 h-3 text-success" />
                                                Last Synced: {new Date(content.updated_at?.toDate()).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="prose max-w-none text-text-primary leading-relaxed bg-gray-50/50 p-6 rounded-2xl border border-gray-100 max-h-[500px] overflow-y-auto custom-scrollbar">
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: highlightQuestionsInHTML(content.content?.replace(/\n/g, '<br>') || 'No content description available.')
                                            }}
                                        />
                                    </div>
                                    {content.video_url && (
                                        <div className="mt-6 flex items-center gap-2 p-4 bg-warm-brown/5 rounded-xl border border-warm-brown/10">
                                            <BookOpen className="w-5 h-5 text-warm-brown" />
                                            <span className="text-sm font-medium text-text-primary">Reference Video: </span>
                                            <a href={content.video_url} target="_blank" rel="noopener noreferrer" className="text-sm text-warm-brown hover:underline truncate">
                                                {content.video_url}
                                            </a>
                                        </div>
                                    )}
                                </Card>
                            ) : (
                                <Card className="flex flex-col items-center justify-center py-20 bg-gray-50/50 border-dashed border-2 border-gray-200 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <AlertCircle className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-500 mb-2">No Content Available</h3>
                                    <p className="text-gray-400 max-w-sm mb-6">
                                        Start by adding a guide or resources for {selectedStream.name} students in this feature section.
                                    </p>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        onClick={() => setIsEditing(true)}
                                        className="btn-primary"
                                    >
                                        Add Now
                                    </motion.button>
                                </Card>
                            )
                        ) : (
                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                                <Card variant="premium">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-text-primary">
                                            {content ? 'Modify Knowledge Base' : 'Initialize New Feature Content'}
                                        </h3>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="text-gray-400 hover:text-gray-600 font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                    <form onSubmit={handleSave} className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-text-secondary ml-1 uppercase tracking-wider">Title / Headline</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl text-text-primary focus:outline-none focus:border-warm-brown focus:ring-4 focus:ring-warm-brown/5 transition-all"
                                                placeholder="e.g., Ultimate Prompting Guide for Engineers"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-text-secondary ml-1 uppercase tracking-wider">Detailed Content (Markdown/HTML)</label>
                                            <textarea
                                                required
                                                value={formData.content}
                                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl text-text-primary focus:outline-none focus:border-warm-brown focus:ring-4 focus:ring-warm-brown/5 transition-all text-sm font-mono"
                                                rows={12}
                                                placeholder="Structure your content here..."
                                            />
                                            <p className="text-[11px] text-text-secondary ml-2 italic">Tip: Use HTML tags like &lt;b&gt;, &lt;h2&gt;, &lt;ul&gt; for rich formatting.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-text-secondary ml-1 uppercase tracking-wider">External Asset URL (Video/PDF)</label>
                                            <input
                                                type="url"
                                                value={formData.video_url}
                                                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl text-text-primary focus:outline-none focus:border-warm-brown focus:ring-4 focus:ring-warm-brown/5 transition-all"
                                                placeholder="https://youtube.com/..."
                                            />
                                        </div>
                                        <div className="pt-4 flex gap-4">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="submit"
                                                disabled={saving}
                                                className="flex-1 py-4 bg-warm-brown text-white rounded-xl font-bold shadow-lg shadow-warm-brown/20 hover:bg-warm-brown/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                            >
                                                {saving ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <>
                                                        <Save className="w-5 h-5" />
                                                        Synchronize
                                                    </>
                                                )}
                                            </motion.button>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(false)}
                                                className="px-8 py-4 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-all"
                                            >
                                                Discard
                                            </button>
                                        </div>
                                    </form>
                                </Card>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
