function convertDuration(duration) {
  const [hours, minutes, seconds] = duration.split(':').map(Number);
  return hours + minutes / 60 + seconds / 3600;
}

module.exports = convertDuration;
