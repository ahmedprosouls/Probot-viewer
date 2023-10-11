import {
  BubbleBlock,
  BubbleBlockType,
  InputBlock,
  InputBlockType,
  Block,
} from '@typebot.io/schemas'
import { isBubbleBlock, isInputBlock } from '@typebot.io/lib'
import type { ProbotPostMessageData } from 'probot-js'

export const getLastChatBlockType = (
  blocks: Block[]
): BubbleBlockType | InputBlockType | undefined => {
  const displayedBlocks = blocks.filter(
    (s) => isBubbleBlock(s) || isInputBlock(s)
  ) as (BubbleBlock | InputBlock)[]
  return displayedBlocks.pop()?.type
}

export const sendEventToParent = (data: ProbotPostMessageData) => {
  try {
    window.top?.postMessage(
      {
        from: 'probot',
        ...data,
      },
      '*'
    )
  } catch (error) {
    console.error(error)
  }
}
