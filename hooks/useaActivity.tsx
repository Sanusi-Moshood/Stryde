export const useActivityMetrics = (distance: number, duration: number) => {
  const formattedDistance = (distance / 1000).toFixed(1);

  const hrs = Math.floor(duration / 3600);
  const mins = Math.floor((duration % 3600) / 60);
  const secs = duration % 60;
  const formattedDuration = `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const pace = (() => {
    if (distance === 0 || duration === 0) return '--:--';
    const km = distance / 1000;
    const paceSeconds = duration / km;
    if (paceSeconds < 150) return '2:30';
    if (paceSeconds > 1200) return '20:00';
    const m = Math.floor(paceSeconds / 60);
    const s = Math.floor(paceSeconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  })();

  const calories = Math.round((distance / 1000) * 60);
  const steps = Math.round((distance / 1000) * 1300).toLocaleString();

  return { formattedDistance, formattedDuration, pace, calories, steps };
};
