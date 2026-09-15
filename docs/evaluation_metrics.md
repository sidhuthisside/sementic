# Evaluation Metrics

To ensure the "Semantic Synthesis" engine delivers value, we measure performance across three dimensions: Accuracy, Quality, and Actionability.

## 1. Role Inference Accuracy

**Definition**: The percentage of files where the inferred role (e.g., "Domain Service") matches the actual responsibility as determined by a senior engineer audit.

*   **Target**: > 85%
*   **Method**:
    *   Select 20 random files from a test repository.
    *   Compare `SemanticSynthesizer.detectFileRole()` output against manual classification.
*   **Baseline (Naive Regex)**: Typically achieves ~60% (confuses implementations with interfaces).

## 2. Architectural Reconstruction Quality

**Definition**: How closely the generated "3D Galaxy" and "Module Interpretations" match the developer's mental model of the system.

*   **Target**: 4/5 (Likert Scale)
*   **Method**: subjective review by repository maintainers.
    *   *Question*: "Does the 'Domain Service' cluster accurately represent your core business logic?"

## 3. Insight Actionability

**Definition**: The ratio of insights that suggest a concrete, valid fix vs. generic observations.

*   **Formula**: `(Actionable Insights / Total Insights) * 100`
*   **Target**: > 50%
*   **Examples**:
    *   *Generic*: "Code complexity is high." (0 points)
    *   *Actionable*: "AuthService has complexity 25 and 0 tests. Refactor `validateToken` method." (1 point)

## 4. Semantic Drift Detection

**Definition**: The system's ability to identify when the *implemented* structure deviates from the *intended* pattern (e.g., a Controller importing a Repository directly in a Clean Architecture).

*   **Test Case**: Deliberately introduce a layer violation in `AppController`.
*   **Success**: System generates an "Architectural Violation" insight with High Severity.
