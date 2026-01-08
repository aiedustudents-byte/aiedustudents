import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, AlertCircle } from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { highlightQuestionsInHTML } from '../../utils/questionHighlighter';

export default function PromptEngineeringGuide() {
    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userDomain, setUserDomain] = useState<string | null>(null);

    useEffect(() => {
        // Get user domain
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            if (userData.domain) {
                setUserDomain(userData.domain);
                fetchContent(userData.domain);
            } else {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    function getCollectionName(domain: string) {
        if (domain === 'B.Com') return 'prompt_engineering_guide_bcom';
        if (domain === 'BBA') return 'prompt_engineering_guide_bba';
        if (domain === 'Civil Engineer') return 'prompt_engineering_guide_civil';
        return null;
    }

    async function fetchContent(domain: string) {
        const outputCollection = getCollectionName(domain);
        if (!outputCollection) {
            setLoading(false);
            return;
        }

        try {
            const q = query(collection(db, outputCollection), orderBy('created_at', 'desc'), limit(1));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                setContent(snapshot.docs[0].data());
            }
        } catch (error) {
            console.error('Error fetching guide content:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin w-8 h-8 border-4 border-warm-brown border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!userDomain) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
                <AlertCircle className="w-12 h-12 text-warning mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">Profile Incomplete</h2>
                <p className="text-gray-600">Please update your profile with your domain to view this guide.</p>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
                <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">No Guide Available</h2>
                <p className="text-gray-600">
                    The prompt engineering guide for <span className="font-semibold text-warm-brown">{userDomain}</span> is coming soon.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card variant="premium" className="overflow-hidden">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-warm-brown rounded-2xl flex items-center justify-center shadow-lg">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-warm-brown">Prompt Engineering Guide</h1>
                            <p className="text-text-secondary text-lg">
                                Specialized guide for <span className="font-semibold text-dark-primary">{userDomain}</span>
                            </p>
                        </div>
                    </div>
                </Card>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <div className="prose max-w-none">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">{content.title}</h2>
                        {content.video_url && (
                            <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg mb-8 bg-black/5">
                                <iframe
                                    src={content.video_url.replace('watch?v=', 'embed/')}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        )}
                        <div
                            className="text-gray-700 leading-relaxed space-y-4"
                            dangerouslySetInnerHTML={{
                                __html: userDomain === 'B.Com'
                                    ? (content.content?.replace(/\n/g, '<br>')
                                        .replace(
                                            'Introduction to Prompt Engineering',
                                            '<span style="color: #1e3a8a; font-weight: bold; font-size: 1.25em;">Introduction to Prompt Engineering</span>'
                                        )
                                        .replace(
                                            'What is Prompt Engineering?',
                                            '<span style="color: #000000; font-weight: bold;">What is Prompt Engineering?</span>'
                                        )
                                        .replace(
                                            'Why B.Com Students Should Learn It',
                                            '<span style="color: #000000; font-weight: bold;">Why B.Com Students Should Learn It</span>'
                                        )
                                        .replace(
                                            'Real-Life Commerce Examples:-',
                                            '<span style="color: #000000; font-weight: bold;">Real-Life Commerce Examples:-</span>'
                                        )
                                        .replace(
                                            'What is an LLM?',
                                            '<span style="color: #000000; font-weight: bold;">What is an LLM?</span>'
                                        )
                                        .replace(
                                            "Here's how AI processes your request:",
                                            '<span style="color: #000000; font-weight: bold;">Here\'s how AI processes your request:</span>'
                                        )
                                        .replace(
                                            'Prompt Types Useful for B.Com Students:-',
                                            '<span style="color: #000000; font-weight: bold;">Prompt Types Useful for B.Com Students:-</span>'
                                        )
                                        .replace(
                                            'Ready-to-Use Prompt Templates for B.Com Students',
                                            '<span style="color: #000000; font-weight: bold;">Ready-to-Use Prompt Templates for B.Com Students</span>'
                                        )
                                        .replace(
                                            'Copy, customize, and use these templates for your assignments, projects, and learning!',
                                            '<span style="color: #000000; font-weight: bold;">Copy, customize, and use these templates for your assignments, projects, and learning!</span>'
                                        ) || '')
                                    : userDomain === 'BBA'
                                        ? highlightQuestionsInHTML(content.content?.replace(/\n/g, '<br>') || '')
                                            .replace(
                                                'Introduction to Prompt Engineering',
                                                '<span style="color: #1e3a8a; font-weight: bold; font-size: 1.25em;">Introduction to Prompt Engineering</span>'
                                            )
                                            .replace(
                                                'For BBA students, prompt engineering is extremely powerful because it helps in:',
                                                '<span style="color: #000000; font-weight: bold;">For BBA students, prompt engineering is extremely powerful because it helps in:</span>'
                                            )
                                            .replace(
                                                'Why Prompt Engineering is Important for BBA Students',
                                                '<span style="color: #000000; font-weight: bold;">Why Prompt Engineering is Important for BBA Students</span>'
                                            )
                                            .replace(
                                                'How AI Models (LLMs) Work – Simple Explanation',
                                                '<span style="color: #000000; font-weight: bold;">How AI Models (LLMs) Work – Simple Explanation</span>'
                                            )
                                            .replace(
                                                'Core Prompt Engineering Principles for BBA',
                                                '<span style="color: #000000; font-weight: bold;">Core Prompt Engineering Principles for BBA</span>'
                                            )
                                            .replace(
                                                'Prompt Types Useful for BBA Students',
                                                '<span style="color: #000000; font-weight: bold;">Prompt Types Useful for BBA Students</span>'
                                            )
                                            .replace(
                                                'Common Mistakes BBA Students Should Avoid',
                                                '<span style="color: #000000; font-weight: bold;">Common Mistakes BBA Students Should Avoid</span>'
                                            )
                                            .replace(
                                                "Ready-to-Use Prompt Templates for BBA Students (Try Out these Prompt Templates with any LLM'S)",
                                                '<span style="color: #000000; font-weight: bold;">Ready-to-Use Prompt Templates for BBA Students (Try Out these Prompt Templates with any LLM\'S)</span>'
                                            )
                                            .replace(
                                                'Closing Note',
                                                '<span style="color: #000000; font-weight: bold;">Closing Note</span>'
                                            )
                                            .replace(
                                                'Remember:',
                                                '<span style="color: #1e3a8a; font-weight: bold;">Remember:</span>'
                                            )
                                            .replace(
                                                'The quality of your output depends on the quality of your prompt!',
                                                '<span style="color: #000000; font-weight: bold;">The quality of your output depends on the quality of your prompt!</span>'
                                            )
                                        : highlightQuestionsInHTML(content.content?.replace(/\n/g, '<br>') || '')
                            }}
                        />
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
