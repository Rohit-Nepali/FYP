# Dataset Diversity Overhaul: Combat Overfitting

## Problem Analysis

Your model achieves **98.7% accuracy on synthetic test data** but drops to ~70-80% on real-world informal text. **Root cause: dataset lacks semantic diversity.**

### Why Overfitting Occurs

The current generator creates patterns that models memorize instead of learning:

| Issue | Impact | Evidence |
|-------|--------|----------|
| **Shared prefixes** ("Honestly,", "Ugh,") across ALL labels | TF-IDF sees these as noise, not signal | Used 45% of the time, appears in every category |
| **Static context injectors** (same "client", "Jira", "report") | Model learns entity→label association, not the reason | Same list applied to all 8 labels |
| **No conflicting samples** | Can't distinguish ambiguous cases like "lazy AND exhausted" | Each sentence is pure, never mixed |
| **High prefix/suffix rates** (45% + 30%) | Model learns fluff patterns, ignores core reason words | Fluff dominates signal in short texts |
| **Small synonym pool** (~35 words) | Over-represented patterns in TF-IDF features | 10,000 rows with limited lexical variation |

### Expected Outcome

After implementing these 4 improvements:
- **Synthetic test accuracy**: 95-98% (slightly lower, but more robust)
- **Gold standard accuracy**: 75-85% (more realistic, less memorization)
- **Real-world performance**: 70-80% → 80-85% (significant improvement)

---

## Implementation Plan: 4 Phases

### Phase 1: Label-Specific Semantic Noise ✅
**File**: `dataset_generator/dataset_generator.py`

**What**: Add label-specific keywords that distinguish reasons instead of shared fluff.

**Changes**:
1. Define `label_noise` dictionary mapping each label to unique semantic keywords
2. Update `apply_noise()` to accept `label` parameter and inject label-specific noise (20% probability)
3. Call it in `augment_text(label, base_text, all_sentences)`

**Example**:
```python
label_noise = {
    "WORK_OVERLOAD": ["stress", "boss", "deadline", "urgent", "demands", "crunch", "pressure"],
    "PROCRASTINATION": ["later", "lazy", "scroll", "distract", "tomorrow", "delay", "avoidance"],
    "LOW_ENERGY": ["tired", "drained", "foggy", "zombie", "sleep", "crash", "exhausted"],
    "FORGETFULNESS": ["blank", "slip", "forgot", "vanish", "memory", "miss", "slipped"],
    "DISTRACTION": ["ping", "notification", "interrupt", "chat", "tab", "context-switch"],
    "POOR_PLANNING": ["wing", "unprepared", "chaos", "guess", "assumption", "scope"],
    "CONSISTENT_PRODUCTIVITY": ["flow", "smooth", "momentum", "efficiency", "clean", "steady"],
    "HIGH_MOTIVATION": ["pumped", "driven", "goal", "unstoppable", "determined", "fired"]
}
```

---

### Phase 2: Dynamic Entity Replacement ✅
**File**: `dataset_generator/dataset_generator.py`

**What**: Replace static context lists with templates so model can't memorize static entities.

**Changes**:
1. Create `entities` dictionary with random options per category
2. Refactor `context_injectors` to use templates with `{person}`, `{platform}`, `{subject}` placeholders
3. In `augment_text()`, replace placeholders before returning

**Example**:
```python
entities = {
    "person": ["manager", "client", "boss", "teammate", "colleague", "lead", "PM"],
    "platform": ["Jira", "Slack", "email", "the portal", "Teams", "Trello"],
    "subject": ["frontend", "the API", "the report", "the database", "the feature"]
}

context_templates = [
    "for the {person} presentation",
    "on the {platform} review",
    "related to the {subject} deadline",
    "for the {person} {subject} review",
]
```

---

### Phase 3: TF-IDF Signal Tuning ✅
**File**: `dataset_generator/dataset_generator.py`

**What**: Reduce fluff dominance, expand vocabulary, add structural variation.

**Changes**:
1. **Reduce fluff rates in `augment_text()`**:
   - Prefix: 45% → 15%
   - Suffix: 30% → 15%
   
2. **Expand `synonyms` dictionary**: ~35 entries → ~150 entries
   - Add verbal variants: "complete", "finish", "wrap up", "close out", "deliver"
   - Add intensity modifiers: "completely", "totally", "absolutely", "utterly", "fully"
   - Add colloquialisms: "cooked", "fried", "gassed", "drained", "wiped"
   
3. **Add `shuffle_clause_order()` function**:
   - For informal labels (PROCRASTINATION, LOW_ENERGY, DISTRACTION)
   - 30% chance to reverse clause order
   - Original: "I'll do it later because I'm scrolling"
   - Swapped: "Because I'm scrolling, I'll do it later"

---

### Phase 4: Sentence Fusion & Real-World Validation ✅
**File**: `dataset_generator/dataset_generator.py` + `training/train_classifier.py` + new file

**What**: Create conflicting samples and validate on semi-real test set.

**Changes**:
1. Add `sentence_fusion(base_text, all_sentences_for_label, label)` function
   - Mix 30% of samples with conflicting sentences from SAME label
   - Example: Combine "I'm fired up" + "my brain is fried" → label = LOW_ENERGY
   - Rule: The "winning" reason (usually more negative) determines the label

2. Create semi-real gold standard test set:
   - Generate 500 samples using aggressive paraphrasing + manual review variations
   - Save as `evaluation/gold_standard_test_set.csv`
   - Structure: [text, label, source_note]

3. Update `train_classifier.py`:
   - Load both synthetic test set (2,000 samples) + gold standard (500 samples)
   - Generate two accuracy metrics in report
   - Flag overfitting if gap > 15%

---

## File Modifications Summary

### Primary: `dataset_generator/dataset_generator.py`

**Add at top** (after imports, before configuration):
- `label_noise` dictionary
- `entities` dictionary  
- `context_templates` list (refactored from `context_injectors`)

**Modify functions**:
- `apply_noise(text, label)` → add label parameter, inject label-specific keywords
- `augment_text(base_text, all_sentences, label)` → add label parameter, reduce prefix/suffix rates to 15%, add sentence_fusion call
- `apply_synonym_swap()` → keep as-is (works well)

**Add new functions**:
- `shuffle_clause_order(text)` → swap clause order for informal labels
- `sentence_fusion(base_text, all_sentences_for_label, label)` → mix conflicting sentences

**Update main generation loop**:
- Pass `label` to `augment_text()`
- Pass `label` to `apply_noise()`
- Ensure output file remains `productivity_dataset_4.csv` (or increment to `_5.csv`)

### Secondary: `training/train_classifier.py`

**Add**:
- Load gold standard test set after line with train/test split
- Generate two separate accuracy metrics (synthetic vs. gold)
- Update JSON report to include both metrics and gap percentage
- Add warning if gap > 15%

### New File: `evaluation/gold_standard_test_set.csv`

**Structure**:
```
text,label,source_note
"I'm super pumped but man my brain is just fried",LOW_ENERGY,fusion_conflict
"Scrolling instead of working because I'm exhausted",PROCRASTINATION,fusion_conflict
...
```

---

## Implementation Checklist

- [ ] Phase 1: Add `label_noise` dict and update `apply_noise(text, label)`
- [ ] Phase 2: Create `entities` dict, refactor `context_injectors` to templates
- [ ] Phase 3: Reduce rates (45%→15%, 30%→15%), expand `synonyms`, add `shuffle_clause_order()`
- [ ] Phase 4a: Add `sentence_fusion()` function
- [ ] Phase 4b: Generate and save `gold_standard_test_set.csv` (500 samples)
- [ ] Phase 4c: Update `train_classifier.py` to load both test sets and report gap
- [ ] Validate: Run generator, inspect samples, check 0 duplicates
- [ ] Test: Train on new dataset, compare metrics

---

## Expected Dataset Characteristics (After Implementation)

| Metric | Before | After | Reason |
|--------|--------|-------|--------|
| **Prefixes per sample** | 45% | 15% | Forces reliance on core reason words |
| **Suffixes per sample** | 30% | 15% | Reduces fluff-based pattern matching |
| **Unique entities** | ~5 static | ~7-10 dynamic | Prevents static memorization |
| **Label-specific keywords** | None | 8 keyword sets | Adds discriminative signal |
| **Conflicting samples** | 0% | ~30% | Teaches ambiguity resolution |
| **Synonym diversity** | ~35 words | ~150 words | Improves lexical variation |
| **Synthetic test accuracy** | 98.7% | ~95-97% | More robust, less memorized |

---

## Real-World Validation Plan

1. **Run dataset generator** → Verify 0 exact + 0 canonical duplicates
2. **Inspect 50 random samples** per label → Confirm label-specific keywords visible
3. **Train classifier** on new 7,500-row dataset → Get synthetic test accuracy
4. **Run on gold standard** → Get gold standard accuracy
5. **Compare**: If gap > 15%, investigate which label patterns are still shared
6. **Iterate**: If needed, increase label_noise injection or reduce prefix rate further

---

## Why This Works (FYP Context)

✅ **Demonstrates ML understanding**: Shows you understand memorization vs. generalization  
✅ **Solves a real problem**: Overfitting isn't a bug—it's a design flaw in data diversity  
✅ **Defensible in viva**: Can explain why shared patterns cause TF-IDF to fail  
✅ **Measurable improvement**: Before/after metrics prove the fix works  
✅ **Sets up for bonus**: "Gold Standard" test set validates robustness, shows rigor  

---

## References

- Current overfitting evidence: `ml-service/reports/classifier/classifier_evaluation_latest.json` (98.7% accuracy)
- Real-world robustness test: `ml-service/evaluation/real_world_classifier_test.py` (poor performance on informal text)
- Dataset location: `ml-service/training/raw/classifier/productivity_dataset_4.csv` (current 10,000 rows)
