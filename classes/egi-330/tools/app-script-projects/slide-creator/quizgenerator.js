function generateQuizFromSlides(slidesUrl) {
  slidesUrl = slidesUrl?slidesUrl:'https://docs.google.com/presentation/d/1xRXu88TRawJCAUNVRgmqUeFyXCZOscWLJADH3WY4iaA/edit#slide=id.SLIDES_API1186405615_25';
  let slideText = extractSlideDeckText(slidesUrl);
  let jsonQuiz = callGemini(jsonquizsyntax+slideText+'\n Output only valid JSON');
  jsonQuiz = callGemini(`Here is a quiz formatted in a specified JSON ${jsonQuiz} 
  Keep this format and review the content of the quiz using this content ${slideText}
  Check for inaccuracies and modify appropriately. 
  Output only valid JSON`)
  jsonQuiz = parseWithFallback(jsonQuiz);
  return (JSON.stringify(jsonQuiz));
}
function regenerateQuiz(quizData, slideUrl){
  let slideText = extractSlideDeckText(slideUrl);
  let prompt = `
  Here is a JSON quiz. 
  ${JSON.stringify(quizData)}
  It includes some instructions in each of the objects that need to be executed.
  regenerate the JSON quiz in the same json format making updates to only the nodes that have instruction fields.
  Use this data as additional context to update the test
  ${slideText}
  ${jsonquizsyntax}
  Output only valid JSON.
  `
  console.log(prompt);
  let jsonQuiz = callGemini(prompt);
  jsonQuiz = parseWithFallback(jsonQuiz);
  return (JSON.stringify(jsonQuiz));

}