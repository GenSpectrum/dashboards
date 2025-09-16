import { expect, test } from 'vitest'
import { render } from 'vitest-browser-preact'

import HelloWorld from './HelloWorld.jsx'

test('renders name', async () => {
  const { getByText } = render(<HelloWorld name="Vitest" />)
  await expect.element(getByText('Hello Vitest!')).toBeInTheDocument()
})
