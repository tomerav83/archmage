import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Findings } from './findings'
import type { Finding } from './review'

const finding = (i: number): Finding => ({
  nodeId: `n${i}`,
  severity: 'warn',
  title: `t${i}`,
  why: 'because',
})

describe('findings', () => {
  it('announces the count and focuses what you click', async () => {
    const onFocus = vi.fn()
    render(<Findings findings={[finding(1)]} onFocus={onFocus} />)
    expect(screen.getByRole('status').textContent).toBe('1')
    await userEvent.click(screen.getByRole('button', { name: /t1/ }))
    expect(onFocus).toHaveBeenCalledWith(finding(1))
  })

  it('says so when there is nothing to flag', () => {
    render(<Findings findings={[]} onFocus={vi.fn()} />)
    expect(screen.getByText('Nothing to flag.')).toBeTruthy()
  })
})
