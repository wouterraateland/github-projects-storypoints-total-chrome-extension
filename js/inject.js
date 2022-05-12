function findIssueNodes(group, isBoard, storypointsColumn) {
  if (isBoard) return group.querySelectorAll("[data-hovercard-subject-tag]");
  else return group.querySelectorAll("[role='row']");
}

function calcStorypoints(issueNode, isBoard, storypointsColumn) {
  const storypointsNode = isBoard
    ? issueNode.querySelector('[data-test-id="custom-label-Storypoints"]')
    : issueNode.querySelectorAll("[role='cell']")[storypointsColumn];
  if (!storypointsNode) throw new Error("no node");
  const storypoints = parseFloat(storypointsNode.innerText);
  return isNaN(storypoints) ? 0 : storypoints;
}

const groups = [];

function addGroup(group) {
  if (groups.some((other) => other.group === group)) return;
  const itemCounter = group.querySelector("[class^=CounterLabel]");
  if (!itemCounter) return;
  groups.push({ group, itemCounter, issues: [] });
}

function updateGroups() {
  const storypointsColumn = [
    ...document.querySelectorAll("[role='columnheader']"),
  ].findIndex((node) => node.innerText === "Storypoints");
  const isBoard = storypointsColumn === -1;

  groups.forEach(({ group, issues }) => {
    const visibleIssueNodes = findIssueNodes(group, isBoard, storypointsColumn);
    visibleIssueNodes.forEach((node) => {
      try {
        const storypoints = calcStorypoints(node, isBoard, storypointsColumn);
        const existingIndex = issues.findIndex(
          (issue) =>
            issue.node.dataset.hovercardSubjectTag ===
            node.dataset.hovercardSubjectTag
        );
        if (existingIndex === -1) issues.push({ node, storypoints });
        else issues[existingIndex] = { node, storypoints };
      } catch (error) {}
    });
    issues.forEach((issue) => {
      try {
        issue.storypoints = calcStorypoints(
          issue.node,
          isBoard,
          storypointsColumn
        );
      } catch (error) {}
    });
  });
}

function renderStorypointLabels() {
  document
    .querySelectorAll("[data-board-column]")
    .forEach((node) => addGroup(node));
  document
    .querySelectorAll('[data-test-id^="table-group-"]')
    .forEach((node) => {
      const testId = node.dataset.testId;
      if (
        !testId.startsWith("table-group-header-") &&
        !testId.startsWith("table-group-footer-") &&
        !testId.startsWith("table-group-name")
      )
        addGroup(node);
    });

  updateGroups();

  groups.forEach(({ group, itemCounter, issues }) => {
    const totalStorypoints = issues.reduce(
      (acc, issue) => acc + issue.storypoints,
      0
    );
    let storypointLabel = group.querySelector(".storypoint-label");
    if (!storypointLabel) {
      storypointLabel = document.createElement("div");
      storypointLabel.className = itemCounter.className;
      storypointLabel.classList.add("storypoint-label");
      itemCounter.parentElement.appendChild(storypointLabel);
    }
    storypointLabel.innerText = `${totalStorypoints} Storypoints`;
  });
}

let storypointsRefreshInterval;

function setupStorypointRendering() {
  renderStorypointLabels();
  clearInterval(storypointsRefreshInterval);
  storypointsRefreshInterval = setInterval(renderStorypointLabels, 1000);
}

setupStorypointRendering();
