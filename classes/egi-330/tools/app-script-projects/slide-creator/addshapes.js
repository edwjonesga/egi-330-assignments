function insertShapesAndConnectors(slide, jsonInput) {
  const shapeElements = {}; // Store created shape elements for connectors

  // Create shapes based on JSON input
  jsonInput.shapes.forEach(shape => {
    let createdShape;
    switch (shape.type) {
      case 'rectangle':
        createdShape = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, shape.x, shape.y, shape.width, shape.height);
        break;
      case 'roundedRectangle':
        createdShape = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, shape.x, shape.y, shape.width, shape.height);
        break;
      case 'circle':
        createdShape = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, shape.x, shape.y, shape.radius * 2, shape.radius * 2);
        break;
      case 'triangle':
        createdShape = slide.insertShape(SlidesApp.ShapeType.TRIANGLE, shape.x, shape.y, shape.width, shape.height);
        break;
    }
    if (createdShape && shape.label) {
      createdShape.getText().setText(shape.label); // Add label to shape
    }
    shapeElements[shape.id] = createdShape; // Store shape element by ID
  });

  const connectorElements = []; // To store connector elements for grouping

  // Create connectors based on JSON input
  jsonInput.connectors.forEach(connector => {
    const startShape = shapeElements[connector.start];
    const endShape = shapeElements[connector.end];

    if (startShape && endShape) {
      const line = slide.insertLine(SlidesApp.LineCategory.STRAIGHT, 
        startShape.getLeft() + startShape.getWidth() / 2, 
        startShape.getTop() + startShape.getHeight() / 2, 
        endShape.getLeft() + endShape.getWidth() / 2, 
        endShape.getTop() + endShape.getHeight() / 2);

      // Set connection points
      const startConnectionSites = startShape.getConnectionSites(); // Use first available connection site
      const endConnectionSites = endShape.getConnectionSites(); // Use first available connection site
      // Determine relative position (right or below)
      // Determine relative position
      if (endShape.getLeft() > startShape.getLeft()) { // End shape is to the right of start shape
        startConnectionSite = startConnectionSites[Math.floor(3 * startConnectionSites.length / 4)];
        endConnectionSite = endConnectionSites[Math.floor(endConnectionSites.length / 4)];
      } else if (endShape.getLeft() < startShape.getLeft()) { // Start shape is to the right of end shape
        startConnectionSite = startConnectionSites[Math.floor(startConnectionSites.length / 4)];
        endConnectionSite = endConnectionSites[Math.floor(3 * endConnectionSites.length / 4)];
      } else if (endShape.getTop() > startShape.getTop()) { // End shape is below start shape
        startConnectionSite = startConnectionSites[Math.floor(startConnectionSites.length / 2)];
        endConnectionSite = endConnectionSites[0];
      } else if (endShape.getTop() < startShape.getTop()) { // Start shape is below end shape
        startConnectionSite = startConnectionSites[0];
        endConnectionSite = endConnectionSites[Math.floor(endConnectionSites.length / 2)];
      } else {
        // Default connection sites if neither right, left, above, nor below
        startConnectionSite = startConnectionSites[0];
        endConnectionSite = endConnectionSites[0];
      }
      line.setStartConnection( startConnectionSite);
      line.setEndConnection( endConnectionSite);

      // Set the line style
      switch (connector.type) {
        case 'arrow':
          line.setEndArrow(SlidesApp.ArrowStyle.OPEN_ARROW);
          break;
        case 'diamond':
          line.setEndArrow(SlidesApp.ArrowStyle.OPEN_DIAMOND);
          break;
        default:
          break; // Leave plain if type is not specified
      }

      connectorElements.push(line); // Store the connector for grouping

      if (connector.label) {
        const labelShape = slide.insertTextBox(connector.label, 
          (startShape.getLeft() + endShape.getLeft()) / 2, 
          (startShape.getTop() + endShape.getTop()) / 2, 
          100, 30);
        labelShape.getText().getParagraphs()[0].getRange().getTextStyle().setFontSize(10); // Optional: adjust font size
        connectorElements.push(labelShape); // Add label to grouping
      }
    }
  });

  // Group all shapes and connectors
  const allElements = Object.values(shapeElements).concat(connectorElements);
  slide.group(allElements); // Group shapes and connectors into a single group
}

// Usage example: apply the function to a specific slide in the presentation
function createShapesOnSlide() {
  // Example of calling the function with a slide and JSON input
const jsonInput = {
  shapes: [
    {
      id: "shape1",
      type: "roundedRectangle",
      x: 100,
      y: 100,
      width: 100,
      height: 50,
      label: "Rectangle 1"
    },
    {
      id: "shape4",
      type: "rectangle",
      x: 400,
      y: 400,
      width: 100,
      height: 50,
      label: "Rectangle 1"
    },
    {
      id: "shape2",
      type: "circle",
      x: 100,
      y: 200,
      radius: 25,
      label: "Circle 1"
    },
    {
      id: "shape3",
      type: "triangle",
      x: 400,
      y: 100,
      width: 50,
      height: 50,
      label: "Triangle 1"
    }
  ],
  connectors: [
    {
      start: "shape1",
      end: "shape2",
      type: "arrow",
      label: "Connector 1"
    },
    {
      start: "shape2",
      end: "shape3",
      type: "diamond",
      label: "Connector 2"
    },
    {
      start: "shape3",
      end: "shape1",
      type: "diamond",
      label: "Connector 2"
    }
  ]
};
  const presentationId = '1dhE2UVL43UkuqdptHG4MiAhPy3bGy4p93T-edLXrcXk'; // Replace with your Google Slides presentation ID
  const slide = SlidesApp.openById(presentationId).getSlides()[0]; // Choose any slide to insert shapes
  insertShapesAndConnectors(slide, jsonInput);
}
