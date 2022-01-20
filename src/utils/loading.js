export const loadingTexts = [
  "one sec...",
  "i'll be right with you...",
  "yeah, gimme a min...",
  "oh this is a good one...",
  "interesting type sound here hm...",
  "oh where'd you find this...",
  "omg it sounds so good...",
  "mmm i'm loving this...",
  "dang i should sample that...",
];

export const getLoadingText = (texts) => {
  return Math.floor(Math.random() * texts.length);
};
