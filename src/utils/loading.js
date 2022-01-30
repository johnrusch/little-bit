export const loadingTexts = [
  "oh this is a good one...",
  "interesting type sound here hm...",
  "oh where'd you find this...",
  "omg it sounds so good...",
  "mmm i'm loving this...",
  "dang i should sample that..."
];

export const loggingInTexts = [
  "oh hi",
  "one sec...",
  "i'll be right with you...",
  "yeah, gimme a min..."
];

export const getLoadingText = () => {
  const index = Math.floor(Math.random() * loadingTexts.length);
  return loadingTexts[index];
};

export const getLoggingInText = () => {
  const index = Math.floor(Math.random() * loggingInTexts.length);
  return loggingInTexts[index];
}
