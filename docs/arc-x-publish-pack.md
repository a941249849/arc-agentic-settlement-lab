# Arc X Publish Pack

Last updated: 2026-05-24

## Strategic Spine

This article is not a generic Arc project announcement, and it is not a copy of the Tempo article.

The correct rhythm is:

```text
1. I first used Tempo to test stablecoin payment semantics.
2. That proved the builder method: build first, then write from evidence.
3. Arc then opened a timely window through the Stablecoins Commerce Stack Challenge.
4. Instead of chasing Arc heat with another transfer demo, I built toward the challenge theme.
5. ArcEscrow is the Arc-side answer: stablecoin commerce as a settlement workflow.
```

Tempo is the **credibility bridge**, not the template.

Arc is the **current build target**, because the challenge theme is directly aligned with:

- cross-border payments and remittance;
- SME financing and trade workflows;
- tokenized assets and compliant DeFi;
- agentic economy.

ArcEscrow sits at the overlap of:

```text
cross-border SME trade
+ USDC settlement
+ agent identity
+ proof-gated escrow
+ evaluator approval
+ auditable receipt
```

## Core Thesis

Chinese:

```text
我这次做 ArcEscrow，不是为了证明 Arc 能转 USDC，而是想验证 Arc 能不能把 USDC 放进一套稳定币商业结算流程里。
```

English:

```text
ArcEscrow tries to show that Arc is more interesting as a stablecoin commerce workflow layer than as another USDC transfer surface.
```

## Best Opening

```text
我前面先补了一篇 Tempo 的开发者实测。

那次关注的是稳定币支付语义：

invoice -> memo -> receipt -> event match -> paid

也就是一笔稳定币付款，能不能被系统识别、归因、对账。

这次转到 Arc，刚好遇到 Arc 的 Stablecoins Commerce Stack Challenge。

所以我没有再做一个普通 transfer demo。

因为如果只是连接钱包、输入地址、转一笔 USDC，其实看不出 Arc 的商业堆栈价值。

我这次想验证的是另一个问题：

Arc 能不能把 USDC 放进一套更完整的商业结算流程里？
```

## Article Architecture

### 1. Why Tempo Comes First

Purpose:

```text
Explain why this is not sudden Arc farming. It is a staged builder path.
```

Suggested text:

```text
我之前先做 Tempo，不是因为只看 Tempo。

而是因为我已经有 Tempo 测试网实测基础，适合先把一个稳定币支付语义闭环补出来。

那次我验证的是：

- 发票编号如何进入 memo
- 钱包返回 tx hash 之后如何查 RPC receipt
- receipt 里能不能匹配 event
- 一笔稳定币付款能不能被系统自动标记为 paid

这给了我一个后续看 Arc 的标准：

不是看热度，也不是看发币预期，而是看能不能构建出一个真实的支付/结算场景。
```

### 2. Why Arc Now

Purpose:

```text
Connect to the current Arc challenge without sounding like a grant pitch.
```

Suggested text:

```text
Arc 现在的窗口刚好很明确：

Stablecoins Commerce Stack Challenge。

它关注的不是单纯转账，而是稳定币在商业里的真实用法：

- 跨境支付和汇款
- 中小企业融资和贸易流程
- 代币化资产和合规 DeFi
- 代理经济

这几个方向里，我认为最适合先做 MVP 的不是“支付按钮”，而是跨境 SME 贸易里的 escrow / letter of credit 场景。
```

### 3. What ArcEscrow Is

Purpose:

```text
Position the product in one clear business scenario.
```

Suggested text:

```text
所以我做了 ArcEscrow。

它可以理解成一个 Agentic Letter of Credit。

场景是：

一个买方要向海外供应商付款。

买方不想在交付证明出现前直接付款。

供应商也不想在没有付款保障前先交付。

传统银行信用证可以解决一部分问题，但流程慢、费用高、对中小企业不友好。

ArcEscrow 尝试用 Arc 的稳定币和 agentic primitives，把这个流程拆成一套更轻量的 settlement workflow。
```

### 4. What Makes It Different From A Transfer Demo

Purpose:

```text
Make the product value obvious to normal readers.
```

Suggested text:

```text
普通转账只回答一个问题：

A 有没有给 B 转钱？

但商业结算要回答的是：

- 这笔钱为什么付？
- 对应哪个 invoice / trade request？
- 谁是 buyer？
- 谁是 supplier？
- 谁有权 approve release？
- 钱是否先进入 escrow？
- 交付证明是否提交？
- 最后有没有 receipt 可以复核？

所以 ArcEscrow 的流程不是 transfer，而是：

deal -> identity -> budget -> escrow -> proof -> evaluator -> receipt
```

### 5. Why This Matches Arc's Challenge Themes

Purpose:

```text
Tie the product directly to the competition direction.
```

Suggested text:

```text
这个方向和 Arc 这次挑战赛有几个重合点：

1. 跨境支付

结算资产是 USDC，场景是 buyer / supplier 的跨境贸易付款。

2. SME trade workflow

不是直接付款，而是围绕 invoice、预算、交付证明、审批和 receipt 做状态机。

3. Agentic economy

buyer、supplier、evaluator 可以被抽象成 agent roles。

4. Compliant / auditable settlement

最后不是只给 explorer link，而是导出 JSON / Markdown receipt，方便财务和运营复核。
```

### 6. Implemented MVP

Suggested text:

```text
目前 demo 已经实现的部分：

- Arc Testnet app
- deal room
- agent proof page
- ERC-8004 identity reads
- ERC-8183 transaction preparation / wallet execution controls
- evaluator review
- deterministic receipt export
- demo video
- GitHub repo
- submission deck

我不会把它包装成生产级金融系统。

它现在更准确的状态是：

functional MVP + challenge submission prototype。
```

### 7. Honest Boundary

Suggested text:

```text
现在不能过度 claim 的部分也要说清楚：

- Circle Wallets 还没有做成 live server-side wallet flow
- Gateway / Nanopayments 还没有接入
- CCTP / Bridge Kit 没有跑资金进入
- USYC / StableFX 目前只是 gated / conceptual extension
- 完整 ERC-8183 tx sequence 还需要最终 wallet-signed evidence

我觉得这点很重要。

Builder demo 不怕阶段性不完整。

最怕的是把 next integration 说成 live integration。
```

### 8. Closing

Suggested text:

```text
所以我现在对 Arc 的判断是：

如果只是做一个 USDC transfer demo，Arc 的差异不会很明显。

但如果把 Arc 放进：

stablecoin settlement
+ agent identity
+ job lifecycle
+ proof-gated release
+ receipt

这个方向就更成立。

这也是我为什么在 Tempo 二次构建之后，选择用 ArcEscrow 切到 Arc。

Tempo 那边更像是在验证 payment semantics。

Arc 这边更适合验证 commerce settlement workflow。

两者不是谁替代谁，而是稳定币支付应用的两个不同层级。
```

## Full Draft

```text
我前面先补了一篇 Tempo 的开发者实测。

那次关注的是稳定币支付语义：

invoice -> memo -> receipt -> event match -> paid

也就是一笔稳定币付款，能不能被系统识别、归因、对账。

我之前先做 Tempo，不是因为只看 Tempo。

而是因为我已经有 Tempo 测试网实测基础，适合先把一个稳定币支付语义闭环补出来。

那次我验证的是：

- 发票编号如何进入 memo
- 钱包返回 tx hash 之后如何查 RPC receipt
- receipt 里能不能匹配 event
- 一笔稳定币付款能不能被系统自动标记为 paid

这给了我一个后续看 Arc 的标准：

不是看热度，也不是看发币预期，而是看能不能构建出一个真实的支付/结算场景。

这次转到 Arc，刚好遇到 Arc 的 Stablecoins Commerce Stack Challenge。

它关注的不是单纯转账，而是稳定币在商业里的真实用法：

- 跨境支付和汇款
- 中小企业融资和贸易流程
- 代币化资产和合规 DeFi
- 代理经济

这几个方向里，我认为最适合先做 MVP 的不是“支付按钮”，而是跨境 SME 贸易里的 escrow / letter of credit 场景。

所以我做了 ArcEscrow。

Demo：
https://arc-agentic-settlement-lab.vercel.app

GitHub：
https://github.com/a941249849/arc-agentic-settlement-lab

Demo video：
https://arc-agentic-settlement-lab.vercel.app/demo/arc-escrow-demo.mp4

ArcEscrow 可以理解成一个 Agentic Letter of Credit。

场景是：

一个买方要向海外供应商付款。

买方不想在交付证明出现前直接付款。

供应商也不想在没有付款保障前先交付。

传统银行信用证可以解决一部分问题，但流程慢、费用高、对中小企业不友好。

ArcEscrow 尝试用 Arc 的稳定币和 agentic primitives，把这个流程拆成一套更轻量的 settlement workflow。

普通转账只回答一个问题：

A 有没有给 B 转钱？

但商业结算要回答的是：

- 这笔钱为什么付？
- 对应哪个 invoice / trade request？
- 谁是 buyer？
- 谁是 supplier？
- 谁有权 approve release？
- 钱是否先进入 escrow？
- 交付证明是否提交？
- 最后有没有 receipt 可以复核？

所以 ArcEscrow 的流程不是 transfer，而是：

deal -> identity -> budget -> escrow -> proof -> evaluator -> receipt

这个方向和 Arc 这次挑战赛有几个重合点。

1. 跨境支付

结算资产是 USDC，场景是 buyer / supplier 的跨境贸易付款。

2. SME trade workflow

不是直接付款，而是围绕 invoice、预算、交付证明、审批和 receipt 做状态机。

3. Agentic economy

buyer、supplier、evaluator 可以被抽象成 agent roles。

4. Auditable settlement

最后不是只给 explorer link，而是导出 JSON / Markdown receipt，方便财务和运营复核。

目前 demo 已经实现的部分：

- Arc Testnet app
- deal room
- agent proof page
- ERC-8004 identity reads
- ERC-8183 transaction preparation / wallet execution controls
- evaluator review
- deterministic receipt export
- demo video
- GitHub repo
- submission deck

我不会把它包装成生产级金融系统。

它现在更准确的状态是：

functional MVP + challenge submission prototype。

现在不能过度 claim 的部分也要说清楚：

- Circle Wallets 还没有做成 live server-side wallet flow
- Gateway / Nanopayments 还没有接入
- CCTP / Bridge Kit 没有跑资金进入
- USYC / StableFX 目前只是 gated / conceptual extension
- 完整 ERC-8183 tx sequence 还需要最终 wallet-signed evidence

我觉得这点很重要。

Builder demo 不怕阶段性不完整。

最怕的是把 next integration 说成 live integration。

所以我现在对 Arc 的判断是：

如果只是做一个 USDC transfer demo，Arc 的差异不会很明显。

但如果把 Arc 放进：

stablecoin settlement
+ agent identity
+ job lifecycle
+ proof-gated release
+ receipt

这个方向就更成立。

这也是我为什么在 Tempo 二次构建之后，选择用 ArcEscrow 切到 Arc。

Tempo 那边更像是在验证 payment semantics。

Arc 这边更适合验证 commerce settlement workflow。

两者不是谁替代谁，而是稳定币支付应用的两个不同层级。
```

## Short Version

```text
我前面先补 Tempo，是为了验证稳定币 payment semantics：

invoice -> memo -> receipt -> event match -> paid

这次转到 Arc，刚好遇到 Stablecoins Commerce Stack Challenge。

所以我没有做普通 transfer demo，而是做了 ArcEscrow：

deal -> identity -> budget -> escrow -> proof -> evaluator -> receipt

ArcEscrow 想验证的是：

Arc 能不能把 USDC 放进一套可验证、可审计、可由 agent 参与的商业结算流程里。

Demo:
https://arc-agentic-settlement-lab.vercel.app
```

## Image Plan

Use four images:

1. `demo-video/arc-escrow-demo/assets/01-home.png`
   - Caption: `ArcEscrow: stablecoin settlement workflow, not a transfer page.`
2. `demo-video/arc-escrow-demo/assets/02-jobs.png`
   - Caption: `Deal lifecycle: buyer, supplier, evaluator, budget, proof, settlement status.`
3. `demo-video/arc-escrow-demo/assets/04-ai-agent.png`
   - Caption: `Evaluator gate: release payment becomes a recorded business decision.`
4. `demo-video/arc-escrow-demo/assets/06-challenge.png`
   - Caption: `Submission pack: live demo, GitHub, video, architecture, and boundaries.`

## Posting Notes

- Tempo should be the lead-in, not the main body.
- The central phrase should be `Stablecoins Commerce Stack Challenge`.
- Keep the article framed as developer evidence, not airdrop speculation.
- Do not claim Circle Wallets / Gateway / CCTP / USYC / StableFX as live integrations.
- Do not claim full onchain-verified ERC-8183 settlement until tx hashes are recorded.
- The strongest phrase for the close: `Tempo verifies payment semantics; Arc verifies commerce settlement workflow.`

