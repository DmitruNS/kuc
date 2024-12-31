// frontend/src/components/Files/FileUpload.tsx
import React, { useState, useEffect, useCallback } from 'react'; 
import { useTranslation } from '../../localization/translations';

interface FileUploadProps {
    propertyId: number;  // Теперь это обязательное поле и всегда number
    onUploadComplete: () => void;
}

interface UploadedFile {
    id: number;
    file_type: string;
    file_path: string;
    is_public: boolean;
}

const FileUpload: React.FC<FileUploadProps> = React.memo(({ propertyId, onUploadComplete }) => {
    // 1. Сначала все useState
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [fileType, setFileType] = useState('image');
    const [isPublic, setIsPublic] = useState(true);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [showLoader, setShowLoader] = useState(false);
    
    const t = useTranslation('ru');
    const updateUploadedFiles = useCallback((newFile: UploadedFile) => {
        setUploadedFiles(prev => [...prev, newFile]);
    }, []);
    // 2. Потом все useEffect
    useEffect(() => {
        console.log('FileUpload mounted with propertyId:', propertyId);

        const fetchFiles = async () => {
            if (!propertyId) return;

            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`https://kuckuc.rs/api/properties/${propertyId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch files');
                }

                const data = await response.json();
                if (data.documents) {
                    setUploadedFiles(data.documents);
                }
            } catch (err) {
                console.error('Error fetching files:', err);
                setError('Failed to load existing files');
            }
        };

        fetchFiles();
    }, [propertyId]);

    useEffect(() => {
        const loadData = () => {
            if (uploading) return;  // было loading, теперь uploading
            setShowLoader(true);
            requestAnimationFrame(() => {
                setShowLoader(false);
            });
        };

        if (selectedFiles) {
            loadData();
        }
    }, [selectedFiles, uploading]); 

    // 3. Потом все обработчики событий
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const maxFileSize = 100 * 1024 * 1024;
        if (e.target.files) {
            const file = e.target.files[0];
            if (file && file.size > maxFileSize) {
                setError('File size exceeds 100MB limit');
                e.target.value = '';
                return;
            }
            setSelectedFiles(e.target.files);
        }
    };


    const handleUpload = async () => {
        if (!selectedFiles) {
            console.log('No files selected');
            return;
        }

        console.log('Starting upload with propertyId:', propertyId); // отладочный вывод

        if (!propertyId || isNaN(propertyId)) {
            setError('Invalid property ID');
            console.error('Invalid propertyId:', propertyId);
            return;
        }

        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', selectedFiles[0]);

            // URL оставляем такой же, так как он соответствует маршруту на сервере
            const uploadUrl = new URL(`https://kuckuc.rs/api/properties/${propertyId}/files`);
            uploadUrl.searchParams.append('file_type', fileType);
            uploadUrl.searchParams.append('is_public', String(isPublic));

            console.log('Uploading to URL:', uploadUrl.toString()); // отладочный вывод

            const token = localStorage.getItem('token');
            const response = await fetch(uploadUrl.toString(), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            const responseText = await response.text();
            console.log('Server response:', responseText);

            if (!response.ok) {
                try {
                    const errorData = JSON.parse(responseText);
                    throw new Error(errorData.error || 'Upload failed');
                } catch (e) {
                    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
                }
            }

            const data = JSON.parse(responseText);
            updateUploadedFiles(data);
            setSelectedFiles(null);
            onUploadComplete();
        } catch (err) {
            console.error('Upload error:', err);
            setError(err instanceof Error ? err.message : 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };


    const handleVisibilityToggle = async (fileId: number, newIsPublic: boolean) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `https://kuckuc.rs/api/properties/${propertyId}/files/${fileId}/visibility`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ is_public: newIsPublic })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update visibility');
            }

            setUploadedFiles(prev =>
                prev.map(file =>
                    file.id === fileId ? { ...file, is_public: newIsPublic } : file
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update visibility');
        }
    };

    const handleDelete = async (fileId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `https://kuckuc.rs/api/properties/${propertyId}/files/${fileId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to delete file');
            }

            setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete file');
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">{t('files')}</h3>

            <div className="space-y-4">
                {/* Выбор типа файла */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('fileType')}
                    </label>
                    <select
                        value={fileType}
                        onChange={(e) => setFileType(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                    >
                        <option value="image">{t('image')}</option>
                        <option value="video">{t('video')}</option>
                        <option value="document">{t('document')}</option>
                    </select>
                </div>

                {/* Переключатель публичности */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="isPublic"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                        {t('publiclyVisible')}
                    </label>
                </div>

                {/* Выбор файла */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('selectFile')}
                    </label>
                    <input
                        type="file"
                        onChange={handleFileSelect}
                        accept={fileType === 'image' ? 'image/*' :
                            fileType === 'video' ? 'video/*' :
                                '.pdf,.doc,.docx,.txt'} // Ограничиваем типы файлов
                        className="block w-full text-sm text-gray-500
        file:mr-4 file:py-2 file:px-4
        file:rounded-full file:border-0
        file:text-sm file:font-semibold
        file:bg-indigo-50 file:text-indigo-700
        hover:file:bg-indigo-100"
                    />
                </div>

                {/* Кнопка загрузки */}
                <button
                    onClick={handleUpload}
                    disabled={!selectedFiles || uploading}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300"
                >
                    {uploading ? t('uploading') : t('upload')}
                </button>

                {error && (
                    <div className="text-red-500 text-sm">{error}</div>
                )}

                {/* Список загруженных файлов */}
                <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{t('uploadedFiles')}</h4>
                    <div className="space-y-2">
                        {uploadedFiles.map(file => (
                            <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center">
                                    <span className="text-sm text-gray-600">
                                        {file.file_path.split('/').pop()}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handleVisibilityToggle(file.id, !file.is_public)}
                                        className={`px-2 py-1 text-xs rounded ${file.is_public
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                    >
                                        {file.is_public ? t('public') : t('private')}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(file.id)}
                                        className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded"
                                    >
                                        {t('delete')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showLoader && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-lg">
                        <p>Processing file...</p>
                    </div>
                </div>
            )}

        </div>
    );
}); 

export default FileUpload;