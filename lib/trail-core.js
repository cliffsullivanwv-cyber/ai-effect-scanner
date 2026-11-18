/* Shared logic for the AI Effect in Education card game.
   Used by cards.html (printing), scan.html (reading) and display.html. */
(function (root) {
  var CHOICES = [
    { key: 'trail',   label: 'Take the Trail',        short: 'Trail',   color: '#2f7d4f' },
    { key: 'caution', label: 'Approach with Caution', short: 'Caution', color: '#c88a12' },
    { key: 'risky',   label: 'Risky Terrain',         short: 'Risky',   color: '#b23a2e' }
  ];

  /* Which printed edge of the card means what.
     The edge the student holds at the TOP is their answer.
     The left edge is left blank on purpose: holding it up means "no answer". */
  var SIDE_TO_CHOICE = { top: 'trail', right: 'caution', bottom: 'risky', left: null };

  var MAX_CARDS = 60;
  var DICTIONARY = 'TRAIL_60';

  /* corners[0] -> corners[1] is the marker's own top edge, wherever it sits in the image.
     Its direction tells us which printed edge of the card is pointing up. */
  function sideUp(corners) {
    var dx = corners[1].x - corners[0].x;
    var dy = corners[1].y - corners[0].y;
    var a = Math.atan2(dy, dx) * 180 / Math.PI; // image y grows downward
    if (a > -45 && a <= 45) return 'top';
    if (a > 45 && a <= 135) return 'left';   // card turned clockwise
    if (a > -135 && a <= -45) return 'right'; // card turned counter-clockwise
    return 'bottom';
  }

  function choiceFor(corners) {
    return SIDE_TO_CHOICE[sideUp(corners)];
  }

  function choiceByKey(key) {
    for (var i = 0; i < CHOICES.length; i++) if (CHOICES[i].key === key) return CHOICES[i];
    return null;
  }

  function markerSVG(id) {
    var dict = new root.AR.Dictionary(DICTIONARY);
    return dict.generateSVG(id);
  }

  function tally(responses, cardCount) {
    var counts = { trail: 0, caution: 0, risky: 0 }, total = 0;
    Object.keys(responses || {}).forEach(function (card) {
      if (+card > cardCount) return;
      var c = responses[card];
      if (counts[c] != null) { counts[c]++; total++; }
    });
    return { counts: counts, total: total };
  }

  var api = {
    CHOICES: CHOICES, SIDE_TO_CHOICE: SIDE_TO_CHOICE, MAX_CARDS: MAX_CARDS,
    DICTIONARY: DICTIONARY, sideUp: sideUp, choiceFor: choiceFor,
    choiceByKey: choiceByKey, markerSVG: markerSVG, tally: tally
  };
  root.TrailCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
