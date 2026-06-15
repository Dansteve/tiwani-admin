// Test setup: register jest-dom matchers (toBeInTheDocument, toBeDisabled, ...) for component tests.
import "@testing-library/jest-dom/vitest";

// Set a document lang so isolated component renders (fragments, not whole pages) do not trip the
// page-level html-has-lang accessibility rule.
document.documentElement.lang = "en";
