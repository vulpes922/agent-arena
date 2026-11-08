# Hosted ChatGPT plan access

## Application status

Submitted through [OpenAI's Sign in with ChatGPT interest form](https://openai.com/form/sign-in-with-chatgpt-interest/) on November 7, 2026 (America/Los_Angeles). The page confirmed receipt and said OpenAI would reach out if the product is a fit. No approval, client credentials, or response deadline has been provided.

Applicant: Junhyuk Hwang, independent developer and Stanford PhD student. Project: **Agent Arena (independent project)**. This is not an application on behalf of Stanford. Contact details were supplied directly in the form and are omitted from repository documentation.

Requested capability: **Sign in and ChatGPT plan use for AI requests**.

Website: https://agent-arena-jh-2026.bryan922.chatgpt.site (private preview). Source: https://github.com/vulpes922/agent-arena (private). The application explicitly states that access can be arranged on request. Neither resource was made public for this submission.

## Product description submitted

Agent Arena is a visual, human-directed AI debate studio for designers and people developing product ideas, built as an independent FIG AI Design Makeathon prototype. A user describes what they want to make; a moderator proposes a brief; two agents with contrasting roles propose ideas, critique each other, revise after human direction, and produce an exportable product blueprint. The user approves the brief and advances each round, pins useful arguments, and steers the final result. A complete arena uses eight model requests, with at most two active requests at once.

We request Sign in with ChatGPT AND permission for visitors to use their own eligible ChatGPT plan for AI requests on a shared website. We do not want to pool the developer account or use an owner-funded API fallback. We would like to use a lighter moderator model where the approved integration supports one.

Current status: the local edition works with each tester's own official Codex CLI sign-in. The hosted URL is a private, authored sample preview; it does not yet perform live hosted inference. Source is private, with local and online editions. Preview/source access can be arranged on request. This application is independent and is not submitted on behalf of Stanford.

We asked about eligibility for this hosted/private app, client registration, plan-use authorization and inference endpoints, available models, and whether the current ChatGPT Sites hosting can support the approved flow. Hosted inference will remain disabled until access is approved and the required integration is implemented.

## Current behavior versus proposed behavior

| Capability | Current online branch | After approval and implementation |
| --- | --- | --- |
| Website access | Existing private Sites access | Preserve approved hosting authentication |
| Plan authorization | Unavailable | Visitor explicitly authorizes their own eligible plan |
| Agent debate | Clearly labeled, authored sample | Real responses to the visitor's mission |
| Generation endpoint | HTTP 503, `approval_required` | Authenticated, bounded requests using that visitor's grant |
| Human direction | Sample pins, notes, edits, and export | Direction included in subsequent model requests |
| Storage | Browser-local history | Browser-local history initially; no implied cloud sync |

## What must happen before live online launch

1. Receive eligibility/approval and the actual hosted plan-use integration contract. Identity sign-in alone is insufficient.
2. Confirm hosting compatibility. Sites owns sign-in routes; its current application identity does not provide a plan-use grant. Use supported platform integration or choose a compatible host with the owner before implementing a separate OAuth flow.
3. Register the actual application/client, allowed origin and callback as required by the approved integration. Do not guess client IDs, scopes, redirect paths, or inference endpoints.
4. Implement visitor-bound authorization, secure server-side grant handling, session expiry, revocation/disconnect, and protection against cross-user access. Never upload local Codex credentials or expose plan tokens to frontend storage.
5. Adapt the existing debate contracts to the approved inference endpoint. Preserve eight bounded calls, two concurrent agents, stop/retry behavior, human-controlled rounds, and explicit usage notices. Handle plan ineligibility and exhausted allowance without a shared-account fallback.
6. Verify with two independent test accounts that requests and usage stay with the correct visitor, including logout, expiry, cancellation, and failed requests. Then enable live mode and update the pending notices.

The interface's roles are prompt perspectives, not separate factual authorities. The output is a product blueprint, not an automatically built or deployed application.

## Official references

- [Sign in with ChatGPT quickstart](https://developers.openai.com/siwc/quickstart)
- [Website integration](https://developers.openai.com/siwc/website)
- [Plan use and hosted-app eligibility](https://developers.openai.com/siwc/token-sharing-open-source)
- [Client registration](https://developers.openai.com/siwc/request-client-id)

Track the response to the submitted contact address. An interest-form receipt does not guarantee approval or availability before the makeathon deadline; the local branch is the working live demonstration path.

## Interface update — November 8, 2026

The online preview now shares the minimal continuous conversation interface with the local edition. Display names are Defender (blue), Challenger (orange), and Moderator (neutral). The submitted application text above remains a record of the original submission. The current local edition runs up to six sequential replies per user-authorized run, with an optional moderator recap; hosted inference remains disabled.
