const testMode = false;

var week13chapter = `To lay a strong foundation for understanding this week’s topics—**Backtracking**, **Branch-and-Bound**, and **solving combinatorial problems**—let's synthesize insights from both _Introduction to Algorithms_ and _Algorithms.pdf_, which deeply explore these topics.

---

**Backtracking** is a general algorithmic technique used for solving constraint satisfaction problems by building a solution incrementally and abandoning ("backtracking") as soon as it determines that the current partial solution cannot be extended to a valid complete solution. It is particularly useful in combinatorial problems where you need to explore all possibilities, such as the N-Queens problem, Sudoku, or the subset sum problem. The algorithm uses recursion to explore each branch of the solution space and uses pruning rules to avoid unnecessary work. In practice, backtracking allows a program to explore a vast space of configurations in a structured and efficient way—by avoiding dead-ends early.

---

**Branch-and-Bound** builds upon some ideas in backtracking but is more focused on optimization problems. It uses bounds to prune branches in a decision tree that cannot yield better solutions than the current best. For example, in the **0/1 Knapsack** problem, if the best solution found so far has a value of 50, and the best possible value from a current branch (based on a relaxed version of the problem) is only 45, that branch can be safely discarded. This strategy is more commonly used for problems like **integer programming**, **TSP (Traveling Salesman Problem)**, and **job scheduling**, where you seek an optimal solution rather than just a feasible one.

---

A critical distinction between backtracking and branch-and-bound is that **backtracking is feasibility-oriented**—it seeks _a_ solution that satisfies the constraints—while **branch-and-bound is optimization-oriented**, looking for _the best_ solution under a given objective function. Another distinction lies in their pruning strategies: backtracking prunes based on violations of constraints, whereas branch-and-bound prunes using cost estimates (upper or lower bounds) derived from relaxations of the problem.

---

Both methods are vital in addressing **combinatorial explosion**, which refers to the exponential growth of possible configurations in problems like traveling salesman, Hamiltonian paths, vertex covers, and integer linear programs. In fact, these problems are often **NP-complete**, and exact solutions via brute-force are computationally infeasible. Algorithms like these give us a structured way to explore feasible paths while minimizing computational cost. Importantly, approximation techniques (like PTAS or 2-approximations for Vertex Cover) and heuristics also emerge in practice where backtracking and branch-and-bound hit performance ceilings.

---

In summary, both backtracking and branch-and-bound are cornerstones of algorithmic strategies for exploring and optimizing within massive search spaces. They are fundamental for understanding not only how to solve difficult problems exactly but also how to build smarter heuristics and approximation methods when exact solutions are too costly. This week’s focus offers a gateway into the broader field of **combinatorial optimization**, where the marriage of problem structure and clever pruning makes the difference between intractability and insight.`
function generateOutline(planForClass,chapterSummary) {
  if (testMode) {
    return parseWithFallback(JSON.stringify({
      "title": "Test Outline",
      "sections": [
        {
          "timeWindowStartMinute": 0,
          "timeWindowEndMinute": 15,
          "title": "Test Section 1",
          "activities": [
            "Test Activity 1",
            "Test Activity 2"
          ]
        },
        {
          "timeWindowStartMinute": 15,
          "timeWindowEndMinute": 40,
          "title": "Test Section 2",
          "topics": [
            {
              "title": "Test Topic 1",
              "details": [
                "Test Detail 1",
                "Test Detail 2"
              ]
            }
          ]
        }
      ]
    }));
  }
  const prompt = fillTemplate(getPromptTemplate('GENERATE_OUTLINE'), {
    chapterSummary,
    planForClass,
    exampleOutlineSyntax
  });
  let outline = callGemini(prompt);
  console.log({outline})
  return parseWithFallback(outline);
}
function cleanUpOutline(outline,plan, chapterSummary){
  if (testMode) {
    return JSON.parse(outline);
  }
  const prompt = fillTemplate(getPromptTemplate('CLEAN_UP_OUTLINE'), {
    outline,
    chapterSummary,
    plan,
    exampleOutlineSyntax
  });
  outline = callGemini(prompt);
  console.log({outline});
  return parseWithFallback(outline);
}
function addLearningObjectives(outline, chapterSummary){
  if (testMode) {
    outline = JSON.parse(outline)
    outline.sections.forEach(section => {
      section.Objectives = ["Test Objective 1", "Test Objective 2"];
    });
    return outline;
  }

  const addPrompt = fillTemplate(getPromptTemplate('ADD_LEARNING_OBJECTIVES'), {
    outline: JSON.stringify(outline),
    chapterSummary,
    exampleOutlineOutcomeSyntax
  });
  let withObjectives = callGemini(addPrompt);

  const improvePrompt = fillTemplate(getPromptTemplate('IMPROVE_LEARNING_OBJECTIVES'), {
    withObjectives,
    chapterSummary,
    exampleOutlineOutcomeSyntax
  });
  withObjectives = callGemini(improvePrompt)
  console.log(withObjectives);
  return parseWithFallback(withObjectives);
}
function mergeSlides(presentations) {
  if (!presentations || presentations.length === 0) {
    return [];
  }

  const firstPresentation = presentations[0];
  const allSlides = [];

  // Iterate through all presentations
  for (const presentation of presentations) {
    if (presentation && Array.isArray(presentation.slides)) {
      allSlides.push(...presentation.slides);
    }
  }

  // Assign all collected slides to the 'slides' property of the first object
  firstPresentation.slides = allSlides;

  // Return the modified first object
  return firstPresentation;
}
function generateSlides(slideDeck,prompts,chapterSummary, weekOutline, slideCount = 45){
  let generatedSlides = [];
  let slides = prompts.map((prompt)=>{
    const slidesPrompt = fillTemplate(getPromptTemplate('GENERATE_SLIDES'), {
      slideSyntax,
      prompt,
      memeSyntax,
      generatedSlides: JSON.stringify(generatedSlides)
    });
    let latestSlides = callGemini(slidesPrompt,false,5);
    try{
      parseWithFallback(latestSlides);
      console.log("Slides parse perfectly.")
    }catch(e){
      console.log(`JSON not parsable ${e}`);
    }
    console.log(`Successfully generated ${latestSlides.length} slides`);
    generatedSlides.push(latestSlides);
    return latestSlides;
  });

  slides = slides.map(slide=>{
    const reviewPrompt = fillTemplate(getPromptTemplate('REVIEW_SLIDES'), {
      slide,
      chapterSummary,
      slideSyntax
    });
    return callGemini(reviewPrompt);
  });
  console.log(slides.length, ' slides generated');
  slides = slides.map(slide=>parseWithFallback(slide));
  let slideDeckJSON = mergeSlides(slides);

  const finalizePrompt = fillTemplate(getPromptTemplate('FINALIZE_DECK'), {
    weekOutline,
    slideCount,
    slideDeckJson: JSON.stringify(slideDeckJSON),
    slideSyntax
  });
  const finalizedDeckJson = callGemini(finalizePrompt);
  const finalSlidesObject = parseWithFallback(finalizedDeckJson);
  const finalDeckJsonString = JSON.stringify(finalSlidesObject);

  return createSlideDeckFromJSON(finalDeckJsonString, slideDeck, true)
  
}

function generatePrompts(sections, chapterSummary){
  if (testMode) {
    return sections.map(section => `Test prompt for section: ${section.title}`);
  }
  let prompts = sections.map(section=>{
    const prompt = fillTemplate(getPromptTemplate('GENERATE_PROMPTS'), {
      chapterSummary,
      section: JSON.stringify(section)
    });
    return callGemini(prompt, true, 5)
  });
  prompts = prompts.map(prompt=>prompt.replace('```prompt','').replace('```',''));
  console.log(prompts.length, ' prompts generated');
  return prompts;
}

function test(){
  let plan = `Week 13:

Backtracking and Branch-and-Bound

Solving combinatorial problems`
 /* let outline = generateOutline(plan)
  outline = cleanUpOutline(outline,plan)
  let withLearningObjectives = addLearningObjectives(outline);
  let outlineWithObjectives = parseWithFallback(withLearningObjectives);
  console.log("Waiting 30 seconds for rate limiting reasons");
  Utilities.sleep("30000");
  let sections = outlineWithObjectives.sections;
  sections = sections.slice(0,2); // just for testing
  console.log({sections})
  let prompts = generatePrompts(sections);
  generateSlides('https://docs.google.com/presentation/d/14Wo_TPdrU75Gt6aXmY_6jtMULy6c12RLZx4mH36u3sQ/edit#',prompts);*/
  generateSlidesForWeek(plan,week13chapter,'https://docs.google.com/presentation/d/14Wo_TPdrU75Gt6aXmY_6jtMULy6c12RLZx4mH36u3sQ/edit#')
}

function generateSlidesForWeek(weekOutline, chapterSummary, slideUrl, slideCount = 45){
    let plan = weekOutline;
    let outline = generateOutline(plan,chapterSummary)
    outline = cleanUpOutline(outline,plan,chapterSummary)
    let withLearningObjectives = addLearningObjectives(outline,chapterSummary);
    let outlineWithObjectives = parseWithFallback(withLearningObjectives);
    console.log("Waiting 30 seconds for rate limiting reasons");
    Utilities.sleep("15000");
    let sections = outlineWithObjectives.sections;
    //sections = sections.slice(0,2); // just for testing
    console.log(sections.length,' sections generated');
    let prompts = generatePrompts(sections,chapterSummary);
    console.log(prompts.length, ' prompts generated');
    return generateSlides(slideUrl,prompts,chapterSummary, weekOutline, slideCount);
}

function parseWithFallback(jsonString) {
  if (testMode && typeof jsonString !== 'string') {
    return jsonString;
  }
  function extractJsonBlock(text) {
    const startTag = '```json';
    const endTag = '```';
    if(!text.indexOf){
      text = JSON.stringify(text);
    }
    const startIndex = text.indexOf(startTag);
    if (startIndex === -1) return text; // No code block, return full

    const jsonStart = startIndex + startTag.length;
    const endIndex = text.indexOf(endTag, jsonStart);
    if (endIndex === -1) return text.slice(jsonStart).trim(); // No closing tag

    return text.slice(jsonStart, endIndex).trim();
  }

  let cleanedJson = extractJsonBlock(jsonString);
  let parsedObject;

  try {
    parsedObject = JSON.parse(cleanedJson);
  } catch (e) {
    const prompt = fillTemplate(getPromptTemplate('FIX_JSON'), {
      errorMessage: e.message,
      jsonString: cleanedJson
    });
    const fixedJson = callGemini(prompt);
    cleanedJson = extractJsonBlock(fixedJson);

    try {
      parsedObject = JSON.parse(cleanedJson);
    } catch (e2) {
      throw new Error(`Failed to parse both original and fixed JSON.\nOriginal error: ${e.message}\nSecond error: ${e2.message}\nFixed JSON:\n${cleanedJson}`);
    }
  }

  return parsedObject;
}
