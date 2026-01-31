import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import DocumentViewer from "@/components/DocumentViewer";

const API = '/api';

export default function DocumentPrintView() {
    const { docId } = useParams();
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                const response = await axios.get(`${API}/documents/${docId}`);
                setDocument(response.data);
            } catch (error) {
                console.error("Failed to load document:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDocument();
    }, [docId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-brand-navy border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!document) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-600">Document non trouvé</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <DocumentViewer document={document} />
        </div>
    );
}
