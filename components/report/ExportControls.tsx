"use client";

import { useState } from "react";
import { FileText, Image as ImageIcon, Printer, Share2, Loader2, Check, Mail, Send, X } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/lib/ToastContext";

export default function ExportControls({ targetId }: { targetId: string }) {
    const { showToast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [exportComplete, setExportComplete] = useState(false);

    // Helper to generate PDF Blob
    const generatePDFBlob = async (): Promise<Blob | null> => {
        const element = document.getElementById(targetId);
        if (!element) return null;

        // Reduce scale to 1.0 for significantly smaller size
        const canvas = await html2canvas(element, {
            scale: 1.0,
            useCORS: true,
            logging: false
        });

        // Use JPEG with 0.5 quality for maximum compression
        const imgData = canvas.toDataURL("image/jpeg", 0.5);

        // Enable compression in jsPDF
        const pdf = new jsPDF({
            orientation: "p",
            unit: "mm",
            format: "a4",
            compress: true
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // Slightly less than A4 height to leave margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;

        // Add subsequent pages if content overflows
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;
        }

        return pdf.output('blob');
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const blob = await generatePDFBlob();
            if (!blob) return;

            // Create a link to download the blob
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = "architect-ai-report.pdf";
            link.click();
            window.URL.revokeObjectURL(url);

            setExportComplete(true);
            setTimeout(() => setExportComplete(false), 2000);
        } catch (e) {
            console.error(e);
        } finally {
            setIsExporting(false);
        }
    };

    const [isSharing, setIsSharing] = useState(false);

    const handleExportPNG = async () => {
        setIsExporting(true);
        try {
            const element = document.getElementById(targetId);
            if (!element) return;

            const canvas = await html2canvas(element, { scale: 2 });
            const link = document.createElement('a');
            link.download = 'architect-ai-report.png';
            link.href = canvas.toDataURL('image/png');
            link.click();

            setExportComplete(true);
            setTimeout(() => setExportComplete(false), 2000);
        } catch (e) {
            console.error(e);
        } finally {
            setIsExporting(false);
        }
    };

    const handleShare = async () => {
        setIsSharing(true);
        try {
            const url = window.location.href;
            if (navigator.share) {
                await navigator.share({
                    title: 'Architect AI Report',
                    text: 'Check out this architecture analysis report',
                    url: url
                });
            } else {
                await navigator.clipboard.writeText(url);
                showToast('Link copied to clipboard!', 'success');
            }
        } catch (e) {
            console.error('Error sharing:', e);
        } finally {
            setIsSharing(false);
        }
    };

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [email, setEmail] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSendEmail = async () => {
        if (!email) return;
        setIsSendingEmail(true);
        try {
            // Generate PDF for attachment
            const blob = await generatePDFBlob();
            let pdfBase64 = '';

            if (blob) {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                await new Promise(resolve => {
                    reader.onloadend = () => {
                        pdfBase64 = reader.result as string;
                        resolve(null);
                    };
                });
            }

            const payload = JSON.stringify({
                email,
                subject: 'Your Architect AI Report',
                attachments: pdfBase64 ? [
                    {
                        filename: 'architect-ai-report.pdf',
                        content: pdfBase64.split(',')[1], // Remove data URL prefix
                        encoding: 'base64'
                    }
                ] : []
            });

            // Vercel has a 4.5MB total request body limit. Base64 adds ~33% overhead.
            // We check for ~4MB to be safe.
            if (payload.length > 4 * 1024 * 1024) {
                showToast('The report is too large to email directly. Please download the PDF instead.', 'warning');
                setIsSendingEmail(false);
                return;
            }

            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload
            });

            if (response.ok) {
                setEmailSent(true);
                setTimeout(() => {
                    setShowEmailModal(false);
                    setEmailSent(false);
                    setEmail('');
                }, 2000);
            } else {
                showToast('Failed to send email. Please try again.', 'error');
            }
        } catch (e) {
            console.error(e);
            showToast('An error occurred while sending the email.', 'error');
        } finally {
            setIsSendingEmail(false);
        }
    };

    return (
        <div className="flex flex-col gap-2 p-4 bg-[#111] border rounded-xl border-white/10">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Export & Share</h3>

            <div className="grid grid-cols-1 gap-2">
                <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="flex items-center justify-center gap-2 p-3 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 rounded-lg transition-all"
                >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : exportComplete ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    <span className="text-sm font-bold">Download PDF Report</span>
                </button>

                <button
                    onClick={() => window.print()}
                    className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-all"
                >
                    <Printer className="w-4 h-4" />
                    <span className="text-sm">Print Report</span>
                </button>
            </div>

            <div className="mt-2">
                <button
                    onClick={() => setShowEmailModal(true)}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-neon-purple to-neon-pink text-white rounded-lg transition-all hover:opacity-90 font-bold shadow-lg"
                >
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Email Report</span>
                </button>
            </div>

            {/* Email Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#111] border border-white/10 p-6 rounded-xl w-96 shadow-2xl relative">
                        <button
                            onClick={() => setShowEmailModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-neon-pink" />
                            Email Report
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Enter your email address to receive the full architecture report.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-neon-pink transition-colors"
                                />
                            </div>

                            <button
                                onClick={handleSendEmail}
                                disabled={isSendingEmail || !email}
                                className="w-full py-2 bg-neon-pink/20 hover:bg-neon-pink/30 text-neon-pink border border-neon-pink/50 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {isSendingEmail ? "Sending..." : "Send Now"}
                            </button>

                            {emailSent && (
                                <p className="text-xs text-green-400 text-center animate-in fade-in slide-in-from-bottom-2">
                                    Email sent successfully! check your inbox.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
