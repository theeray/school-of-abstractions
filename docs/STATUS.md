# Integration status — 2026-10-05

## This commit

Imports the artist-approved Saige-led design from `School-of-Abstractions-Saige-led-site-preview.html`. The portrait, collaborator role, four narrative paths and curated conversation have been retained. The code is separated into maintainable static assets. Phone navigation, focus outlines and direct story-to-answer navigation are included.

No API key, account export, private conversation archive, hosting credential, model request or paid service was added.

## Next integration steps

1. Recover and merge the earlier painting viewer, twenty detail targets, source-image gallery and full selected-dialogue timeline. Preserve the Saige-first navigation. Use explicitly labelled study imagery until Eric approves the final master.
2. Add the final Topaz painting and generate its image pyramid; verify each target against the actual final composition.
3. Review the public knowledge notes and Saige's first-person answer style. Keep new narration separate from exact conversation excerpts. Add Steve Sundahl's approved quote when supplied.
4. Connect a server-side agent only after authentication, rate limits, a durable global usage cap, retention disclosures and failure handling have been reviewed. Never put a provider key in a web page or repository.
5. Design and approve the spoken voice and microphone consent separately. No audio feature is implemented in this design commit. Firebase's current preview configuration disables microphone and camera access.
6. Select the authorized Firebase project and target site, deploy, then verify the actual public URL. A GitHub source update alone is not evidence of a live deployment.

## Future endpoint interface retained by the component

Only a same-origin `endpoint` attribute can activate the connection hook. No attribute is present in the current page. A status response at `<endpoint>/status` must explicitly report `aiConfigured: true`; consent is requested before sending the first question. The page never requests or stores a provider API key.

The previous server proof of concept is not activated or represented as production-ready here. A future implementation must be tested against its current provider documentation and the approved privacy and usage constraints.
