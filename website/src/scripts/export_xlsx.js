const exportXlsx = async (idList, apiBaseUrl = 'http://localhost:8000') => {
    if (!Array.isArray(idList) || idList.length === 0) {
        throw new Error('No IDs available for XLSX export');
    }

    try {
        const response = await fetch(`${apiBaseUrl}/api/sheet/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_list: idList,
                file_format: 'xlsx'
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting XLSX:', error);
        throw error;
    }
};

export default exportXlsx;
