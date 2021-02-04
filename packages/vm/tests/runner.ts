const level = require('level')
import { Transaction } from '@ethereumjs/tx'
import VM from '../lib'
import { SecureTrie as Trie } from '@ethereumjs/trie'
import { DefaultStateManager } from '../lib/state'
import Common from '@ethereumjs/common'
import { Block } from '@ethereumjs/block'

const main = async () => {
  const txData = {
    nonce: '0x1a',
    gasPrice: '0xba43b7400',
    gasLimit: '0x493e0',
    to: '0x9ca228250f9d8f86c23690074c2b96d5f5479f79',
    value: '0x0',
    data:
      '0xa9059cbb000000000000000000000000bfe465e7eb5a2928b5bf22bef93ad06089dc6179000000000000000000000000000000000000000000000000006a94d74f430000',
    v: '0x1c',
    r: '0xc04f048766bea3b20dcea6d2fcaecc92f1a615d337606ab6eec2a1e8e1f27bfe',
    s: '0x1c57e62653724560b06c95be750d958840db9fa44ffa777b6625b344bfadbbcf',
  }
  const common = new Common({ chain: 'mainnet', hardfork: 'chainstart' })
  const tx = Transaction.fromTxData(txData, { common })
  const trie = new Trie(level('/Users/jochem/Library/Ethereum/ethereumjs/mainnet/state/'))

  // Ensure we run on the right root
  trie._setRoot(
    Buffer.from('9dceb42e227ee6a244449d1d92cc5e0c17c63b520d0ff050d943baa8055d0ca6', 'hex')
  )

  const stateManager = new DefaultStateManager({ trie, common })
  const vm = new VM({ stateManager, common })

  vm.on('step', (o: any) => {
    if (o.opcode.name == 'SSTORE') {
      console.log(
        o.stack[o.stack.length - 1].toString('hex'),
        o.stack[o.stack.length - 2].toString('hex')
      )
    }
  })

  const block = Block.fromBlockData(
    {
      header: {
        // Ensures our fees get added to coinbase after we run the Tx (this is important for the state root in the receipt)
        coinbase: Buffer.from('52bc44d5378309ee2abf1539bf71de1b7d7be3b5', 'hex'),
      },
    },
    { common }
  )

  await vm.runTx({ tx, block })
  const expectedRoot = Buffer.from(
    '9d735b19daf3205f93e60f3eb02df6b211aebb4d3a2c512cb51055d8ecfb35c1',
    'hex'
  )

  console.log((await vm.stateManager.getStateRoot()).toString('hex'))
  console.log(expectedRoot.toString('hex'))
}

main()
