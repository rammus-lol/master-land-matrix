const exportPdf = async (idList, apiBaseUrl = 'http://localhost:8000') => {
    if (!Array.isArray(idList) || idList.length === 0) {
        throw new Error('No IDs available for PDF export');
    }

    try {
        const response = await fetch(`${apiBaseUrl}/api/sheet/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_list: idList,
                file_format: 'pdf'
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export_report.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting PDF:', error);
        throw error;
    }
};

export default exportPdf;
