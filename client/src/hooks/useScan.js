import { useState, useEffect, useCallback } from 'react';
import { scanUrl, fetchHistory, clearHistory as apiClearHistory } from '../services/api';

export function useScan() {
  const [scanResult, setScanResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetchHistory();
      if (res.success) {
        setHistory(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const executeScan = async (targetUrl) => {
    setLoading(true);
    setError(null);
    try {
      const res = await scanUrl(targetUrl);
      if (res.success && res.data) {
        setScanResult(res.data);
        await loadHistory();
        return res.data;
      } else {
        throw new Error(res.error || 'Scan failed.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'An unexpected error occurred during scan.';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const selectScan = (scanItem) => {
    setScanResult(scanItem);
    setError(null);
  };

  const clearScanHistory = async () => {
    try {
      await apiClearHistory();
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    scanResult,
    history,
    loading,
    historyLoading,
    error,
    setError,
    executeScan,
    loadHistory,
    selectScan,
    clearScanHistory
  };
}
