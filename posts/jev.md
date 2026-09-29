For the last few years, progress in AI has largely meant building better Large Language Models.

Give an LLM some text, and it generates more text.

That architecture is incredibly useful when we want AI to write an email, explain a concept, generate code, summarize a document, or have a conversation.

But a surprisingly large percentage of AI workloads don't actually require generated text.

They require a decision.

Is this transaction fraudulent?

Which category does this product belong to?

Which team should receive this support ticket?

Should an AI agent retry this operation?

Is this customer high, medium, or low risk?

For these problems, asking a large language model to generate an answer may be unnecessary overhead.

That is the problem TypeSafe AI is trying to address with Jev, its first "System One Model." Instead of generating arbitrary strings, Jev takes unstructured information and returns predefined, typed decisions together with probabilities. TypeSafe describes the basic abstraction as unstructured state going in and typed probabilistic decisions coming out.

From Generation to Decision

Consider a simple classification problem.

Suppose an e-commerce company receives this customer message:

"My package was supposed to arrive yesterday, but tracking hasn't changed in three days."

We want to route it into one of four categories:

Delivery Issue | Cancellation | Return | Payment Issue

A traditional LLM might receive a prompt asking it to classify the message and return JSON.

It then generates tokens sequentially to produce something resembling:

{"category": "Delivery Issue"}

The application subsequently has to parse that output, validate the schema, handle malformed responses, and potentially retry when the output doesn't conform to expectations.

Jev approaches the problem differently.

The possible outputs are defined beforehand. Instead of writing a response, the model makes a decision among those possibilities and exposes probabilities associated with them.

Conceptually, the result could look like:

Delivery Issue → 0.94
Cancellation → 0.02
Return → 0.03
Payment Issue → 0.01

The software can immediately consume that decision.

There is no essay to generate and no arbitrary response format to interpret.

This is the central idea behind Jev.

Why Type Safety Matters

LLMs fundamentally produce strings.

Even when developers request JSON or another structured format, the underlying model is still generating tokens.

That flexibility is one of the greatest strengths of LLMs, but it can become unnecessary complexity when the set of valid outputs is already known.

Jev reverses the relationship.

The developer defines what valid outputs can exist, and the model selects among those possibilities. TypeSafe says Jev's outputs are type-safe structured values and that possible outputs and their structure are specified in advance.

That property is particularly interesting for backend systems.

Imagine that an order-risk system accepts only:

APPROVE

REVIEW

REJECT

A generative model theoretically has an enormous output space even though the application only cares about three values.

A decision model operates directly inside that constrained output space.

Jev Is More Than a Classifier

It would be easy to describe Jev as a very fast classification model.

But that undersells the idea.

Classification is one application of a more general abstraction: making structured decisions about state.

A developer can define the possible decisions required by an application and ask the model to evaluate them.

That opens applications such as:

ticket and document categorization

fraud and risk assessment

content moderation

lead qualification

model and tool routing

ranking and scoring

AI-agent control decisions

deciding whether an agent should retry or escalate

Early developers are already experimenting with Jev for tasks such as PR categorization, email triage and large-scale signal classification.

The Speed Difference Could Be Significant

Traditional LLM inference is autoregressive.

The model predicts one token, adds it to the sequence, predicts another token, and continues until the response is complete.

That makes sense when the desired output is a paragraph.

It makes much less sense when the desired output is effectively:

YES: 92%

TypeSafe says System One Models instead generate their outputs in parallel. For Jev, the company reports end-to-end latency ranging roughly from 70 ms to 500 ms, depending on the workload, and claims improvements of roughly 40–200× for comparable System One-shaped queries. These are TypeSafe's own reported benchmarks, so they should be treated as vendor claims rather than universal performance guarantees.

This difference becomes important at scale.

Imagine processing millions of product listings, transactions, support tickets or events.

Saving even hundreds of milliseconds on every decision can fundamentally change what applications are economically practical.

Then There Is the Cost

The economics are equally interesting.

At launch, TypeSafe listed Jev input pricing at $0.042 per million tokens, with output effectively free because its structured outputs are inexpensive enough that the company says it does not meter them separately.

Again, this isn't necessarily a replacement for an LLM.

The models are solving different problems.

If you need to generate a detailed explanation, Jev isn't designed for that.

But if you're paying a frontier LLM millions of times to answer something equivalent to:

A, B, C or D?

then a specialized decision model starts to become extremely compelling.

Categorization Is Where This Gets Interesting

Consider product categorization in e-commerce.

A marketplace might receive:

"Men's slim-fit cotton checked casual shirt, blue, size M"

and need to determine:

Department → Fashion
Category → Men's Clothing
Subcategory → Shirts
Product Type → Casual Shirt

At marketplace scale, millions of such classifications may need to happen continuously.

A general-purpose LLM can perform this task.

But generating text isn't actually part of the business requirement.

The business needs reliable values that downstream systems can consume.

This is almost exactly the workload that the System One approach targets.

The same architecture could potentially be used for seller-risk classification, return-reason categorization, customer-support routing, fraud detection, catalog quality checks and many other decision-heavy workflows.

Confidence Changes the Architecture

One of the more useful aspects of Jev is that decisions are accompanied by probabilities.

Suppose a categorization system produces:

Electronics → 0.97

The application may confidently automate the decision.

But suppose another example produces:

Electronics → 0.41
Home Appliances → 0.38
Other → 0.21

Now the system knows the decision is ambiguous.

Instead of blindly accepting it, the application could escalate the example to a larger model or a human reviewer.

That enables an architecture such as:

Input → Jev → High confidence → Automated decision

Input → Jev → Low confidence → LLM/Human review

This model-cascade architecture may ultimately be more important than thinking about Jev as an LLM replacement.

Cheap models handle easy decisions.

Expensive models handle difficult ones.

Humans handle the cases where uncertainty still matters.

The "System One" Idea

The terminology comes from the distinction between fast, intuitive decisions and slower, deliberate reasoning.

TypeSafe applies that analogy to AI systems.

LLMs—particularly reasoning models—can spend substantial computation generating and reasoning through answers.

System One Models instead target situations where software needs a rapid decision.

That means the future AI stack may not consist of one enormous model handling everything.

Instead, we may see systems composed of specialized layers:

System One models for fast decisions.

LLMs and reasoning models for complex reasoning.

Tools and APIs for taking actions.

Humans for ambiguous or consequential cases.

Jev therefore represents an interesting shift from asking:

"How intelligent can one model become?"

toward asking:

"What is the right amount of intelligence for each decision?"

But Jev Is Still Very New

The excitement around Jev shouldn't obscure an important point: the model was only publicly launched in September 2026.

Independent evidence is still developing.

An early research review of typed decision models found that their clearest demonstrated advantages so far appear to be latency and cost rather than a universal accuracy advantage over alternative approaches. The authors also caution that calibration and accuracy need to be evaluated on the specific workload where the model will actually be deployed.

Another recent evaluation of System One models in security applications found that good aggregate calibration can still hide confidently incorrect predictions for particular categories of inputs. That matters whenever confidence scores are being used to automate consequential decisions.

So Jev shouldn't simply be treated as "LLMs, but better."

It is a different design point.

And its usefulness will depend heavily on the task.

The Bigger Idea Behind Jev

The most interesting thing about Jev may not ultimately be Jev itself.

It is the architectural idea it represents.

The first wave of generative AI taught developers to put an LLM behind almost everything.

But many applications don't actually need generation.

They need classification.

Ranking.

Routing.

Scoring.

Filtering.

Approval.

Escalation.

In other words, they need decisions.

If specialized models can make those decisions with sufficient accuracy while being dramatically faster and cheaper, the AI architecture of the next few years could look very different from today's "send everything to an LLM" approach.

Instead of one giant model doing everything, applications could contain multiple levels of intelligence—using expensive reasoning only when the problem actually requires it.

Jev is an early and particularly interesting example of that direction.

And for developers building AI systems at scale, the question may soon change from:

"Which LLM should I use?"

to:

"Does this task need an LLM at all?"

![Image](/posts/images/2026-09-30-socialimage-8nsb.jpeg)
