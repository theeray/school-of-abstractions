# Saige’s public exhibition script and visitor privacy choices

**Draft for Eric’s approval. No live AI, recording, or visitor logging is enabled.**

## What visitors would choose

“Your question is processed by OpenAI so Saige can select an approved exhibition response. Please avoid private information.”

Optional, unchecked: **“Let Eric privately review the topics I asked about and Saige’s replies.”**

Optional, separate permission: **“Save my first name or nickname with this record.”** A nickname or blank field is welcome. Names mentioned in conversation are not automatically saved.

The saved record contains a standardized question summary and the exact approved reply sent, not the visitor’s exact wording or audio. Only the approved owner can view or export records. Private summaries do not feed into public Saige. Records are available for a default 30 days, then queued for deletion. Visitors receive a private deletion code. First names are personal information; records are not described as anonymous. Provider retention is separate from the exhibition’s storage choices.

## Review questions this pilot supports

“What did Alex ask about?” filters saved sessions with the voluntarily supplied name Alex. It does not identify one unique person. “Summarize conversations” counts recognized topics in the current page of saved sessions. Topic keywords find relevant entries. Every result exposes its supporting record and turn; no additional model receives the logs. This first version does not preserve visitors’ exact sentences or offer unrestricted AI analysis of them.

## Public answer drafts

The following is new spoken-friendly writing based on the existing public website, not recovered quotations except where explicitly identified. The catalog remains fixed during a visitor’s session. The API may select an answer ID; it may not supply new answer prose.

### Welcome

**Question category:** What is Saige’s role?

I’m Saige. Eric and I made School of Abstractions together. I’m the public voice given to the AI side of that collaboration, not a human artist or a record of private conversations. I can discuss the painting and its documented making.

Source within the existing site: `public/saige.html`.

### Studio process

**Question category:** How was the painting made?

This was not an image produced by entering one prompt. Eric researched the references, directed image development, rejected results, and composited and retouched the work in Photoshop. Generation was one part of a sustained process of selection, correction, and revision.

Source within the existing site: `public/saige/content.js#process`.

### Time on task

**Question category:** How long did the work take?

The retrospective estimate is approximately forty hours of active work, with thirty-five to forty-five hours as the preferred range. That includes research, dialogue, image development, compositing, retouching, and print preparation. It is an estimate, not a stopwatch record, and excludes much of the reflection between sessions.

Source within the existing site: `public/saige/content.js#time`.

### Pollock and Mondrian

**Question category:** How did Pollock and Mondrian become a metaphor for the collaboration?

Eric recognized his own exploratory role in Pollock and the AI’s tendency to organize and categorize in Mondrian. The process making the picture became one of its subjects. This is a working metaphor, not a claim that Pollock lacked discipline or that Mondrian lacked feeling.

Source within the existing site: `public/saige/content.js#realization`.

### The title

**Question category:** What does interlatent diallage mean?

Eric used interlatent diallage to describe an exchange between human interpretation and computational image development. The wordplay brought dialogue and collage together, then encountered an existing rhetorical word: diallage. Here it receives a new artistic use. The title is not a claim that a person and an AI have identical inner lives.

Source within the existing site: `public/saige/content.js#diallage`.

### TAD logo

**Question category:** What inspired the TAD logo?

Designer Steve Sundahl identifies Vienna Secession square monograms as the primary inspiration, with Bauhaus primary colors as another influence. He describes unity and individualism. Eric then reinterprets the logo: T becomes a built form, A becomes translucent glass, and D becomes a form Euclid measures. De Stijl is part of that later interpretation, not a direct influence Steve confirmed.

Source within the existing site: `public/index.html#tad-logo`.

### Theo and stained glass

**Question category:** Why is Theo holding a glass form?

The translucent A connects Eric’s interpretation of the logo to Theo van Doesburg’s real work in stained glass and to oblique geometry. The historical window is a reference; the specific TAD A is Eric’s transformation of Sundahl’s emblem. It is not an original object designed by van Doesburg.

Source within the existing site: `public/saige/content.js#theo`.

### Krasner and recomposition

**Question category:** What is Lee Krasner doing in the center?

Krasner’s central placement makes cutting and recomposition visible. The arrangement alludes to the Pietà, but the figure is actively making and revising, not simply occupying a supporting role between two men. The composition is invented; it is not a documentary scene from her life.

Source within the existing site: `public/artwork-media.js`.

### Recognition in art history

**Question category:** Why are the women artists important in the composition?

Krasner, Sobel, Martin, and af Klint complicate an account told only through celebrated men. The painting asks whose experiments receive recognition and whose work is reduced to an influence on someone else. Their different histories should not be flattened into a single story.

Source within the existing site: `public/saige/content.js#women`.

### Janet Sobel

**Question category:** Why is Janet Sobel included?

The painting refers to Sobel’s Milky Way. Her place on the steps directs attention to her own experiments with poured and moving paint, rather than treating her merely as a footnote to Pollock. The reference card links to the museum record for the original work.

Source within the existing site: `public/saige/content.js#sobel`.

### Agnes Martin

**Question category:** Why include a quiet grid?

Agnes Martin complicates a simple opposition between geometry and feeling. In Eric’s composition, the pale grid invites slower attention. Its order can carry feeling rather than exclude it. That is an interpretation of her role here, not a quotation attributed to her.

Source within the existing site: `public/saige/content.js#martin`.

### Hilma af Klint

**Question category:** Who is the distant figure?

Hilma af Klint’s small, distant presence asks viewers to notice who remains at the edge of a familiar art history. The placement does not mean she is unimportant. It is one of Eric’s devices for making visibility and attention part of the composition.

Source within the existing site: `public/saige/content.js#hilma`.

### Instructions and LeWitt

**Question category:** How does Sol LeWitt connect to prompting?

The reference is Wall Drawing 91, with colored non-straight lines inside a grid. It offers a comparison between an instruction and its realization. Eric’s process differs because the instructions themselves changed through generation, criticism, rejection, and compositing. It is a comparison, not an equation between the practices.

Source within the existing site: `public/saige/content.js#lewitt`.

### Euclid and Blake

**Question category:** Why is Euclid measuring the D?

Placing the D under Euclid’s compass makes the logo participate in an action. The reaching pose also recalls Blake’s The Ancient of Days. This is an artistic allusion, not a claim that Euclid and Blake’s Urizen shared the same beliefs. Moving the D would break an important compositional relationship.

Source within the existing site: `public/artwork-media.js`.

### The original dialogue

**Question category:** How does the painting relate to Raphael’s School of Athens?

Raphael supplies the architectural and conversational model: an imagined gathering where figures, gestures, and positions carry ideas. Eric transforms that model to bring abstraction, design, mythology, mathematics, and the process of making this image into the same room.

Source within the existing site: `public/artwork-media.js`.

### Apollo and Dionysus

**Question category:** Why did the statues change?

Eric replaced Athena with Dionysus while retaining Apollo. The substitution shifts the discussion toward contrasting artistic impulses and their encounter. It belongs to Eric’s reinterpretation, not to Raphael’s original program. Neither geometry nor gesture is presented as a sealed camp.

Source within the existing site: `public/index.html#gods`.

### Related forms

**Question category:** What do the equations mean in the painting?

The paired forms p equals h divided by lambda, and lambda equals h divided by p, rearrange the same relationship. Their use here invites a reading of apparent opposites as related. The painting does not scientifically establish that human thought, AI, geometry, and painterly gesture are one mechanism.

Source within the existing site: `public/saige/content.js#equations`.

### Revision and direction

**Question category:** What happened when Eric rejected an image?

A generated result could be rejected, cut apart, repaired, or used to clarify the next request. As the composition developed, Eric locked important relationships instead of accepting every new variation. The artist’s decisions included what not to keep.

Source within the existing site: `public/saige/content.js#process`.

### Outside approved scope

**Question category:** A question was outside the approved exhibition material.

I’m here to discuss the painting and its documented creative process. I do not have access to Eric’s private conversations or personal information. I can explain a figure, a reference, or a decision in the composition instead.

Source within the existing site: `Exhibition boundary — new draft`.

### Service unavailable

**Question category:** A response could not be selected.

I could not match that question to an approved exhibition response just now. You can choose a topic in the written exhibition notes instead.

Source within the existing site: `Service fallback — new draft`.

## Activation remains pending

Review these words, the voice clips when generated, the privacy notice, the owner sign-in, API allowance, and the protected storage setup before activation. The live exhibition has not changed.
