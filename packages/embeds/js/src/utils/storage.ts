const sessionStorageKey = 'resultId'

export const getExistingResultIdFromStorage = (probotId?: string) => {
  if (!probotId) return
  try {
    return (
      sessionStorage.getItem(`${sessionStorageKey}-${probotId}`) ??
      localStorage.getItem(`${sessionStorageKey}-${probotId}`) ??
      undefined
    )
  } catch {
    /* empty */
  }
}

export const setResultInStorage =
  (storageType: 'local' | 'session' = 'session') =>
  (probotId: string, resultId: string) => {
    try {
      ;(storageType === 'session' ? localStorage : sessionStorage).removeItem(
        `${sessionStorageKey}-${probotId}`
      )
      return (
        storageType === 'session' ? sessionStorage : localStorage
      ).setItem(`${sessionStorageKey}-${probotId}`, resultId)
    } catch {
      /* empty */
    }
  }
