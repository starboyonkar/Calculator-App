(() => {
  const outputEl = document.getElementById('output')
  const historyEl = document.getElementById('history')
  const buttons = document.querySelectorAll('.btn')

  let expr = ''
  let lastAns = null

  function refresh() {
    outputEl.textContent = expr || '0'
  }

  function safeTransform(s) {
    if (!s) return ''
    // replace unicode operators and tokens
    s = s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
    s = s.replace(/\bpi\b/g, 'Math.PI')
    s = s.replace(/\be\b/g, 'Math.E')
    s = s.replace(/\^/g, '**')

    // map ln and log10
    s = s.replace(/\bln\s*\(/g, 'Math.log(')
    s = s.replace(/\blog10\s*\(/g, 'Math.log10(')
    s = s.replace(/\blog\s*\(/g, 'Math.log10(')

    // prefix Math for common funcs
    s = s.replace(/\b(sin|cos|tan|asin|acos|atan|sqrt|abs|floor|ceil|round|exp|pow)\s*\(/g, 'Math.$1(')

    // support ANS token
    s = s.replace(/\bANS\b/g, String(lastAns === null ? 0 : lastAns))

    return s
  }

  function isSafe(s) {
    // only allow digits, operators, letters, Math, parentheses, dot, comma, spaces
    return !/[^0-9+\-*/().,\sA-Za-z_%]/.test(s)
  }

  function evaluateExpression(input) {
    const transformed = safeTransform(input)
    if (!isSafe(transformed)) throw new Error('Invalid characters')
    // polyfill Math.log10 if missing
    if (!Math.log10) { Math.log10 = (x) => Math.log(x) / Math.LN10 }
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('return (' + transformed + ')')
      const result = fn()
      if (typeof result === 'number' && Number.isFinite(result)) return result
      throw new Error('Result is not finite')
    } catch (e) {
      throw e
    }
  }

  function handleButtonClick(e) {
    const b = e.currentTarget
    const val = b.dataset.value
    const action = b.dataset.action

    if (action === 'clear') {
      expr = ''
      historyEl.textContent = ''
      refresh()
      return
    }

    if (action === 'back') {
      expr = expr.slice(0, -1)
      refresh()
      return
    }

    if (action === 'paren') {
      // simple toggle insert
      const open = (expr.match(/\(/g) || []).length
      const close = (expr.match(/\)/g) || []).length
      expr += (open === close) ? '(' : ')'
      refresh()
      return
    }

    if (action === 'equals') {
      if (!expr) return
      try {
        const res = evaluateExpression(expr)
        historyEl.textContent = expr + ' ='
        outputEl.textContent = String(res)
        lastAns = res
        expr = String(res)
      } catch (err) {
        outputEl.textContent = 'Error'
        expr = ''
      }
      return
    }

    if (action === 'ans') {
      expr += (lastAns === null) ? '0' : String(lastAns)
      refresh()
      return
    }

    if (val !== undefined) {
      expr += val
      refresh()
    }
  }

  buttons.forEach(b => b.addEventListener('click', handleButtonClick))

  // keyboard support
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault()
      document.querySelector('[data-action="equals"]').click()
      return
    }
    if (ev.key === 'Backspace') {
      ev.preventDefault()
      document.querySelector('[data-action="back"]').click()
      return
    }
    if (ev.key === 'Escape') {
      ev.preventDefault()
      document.querySelector('[data-action="clear"]').click()
      return
    }

    // allow numbers, operators, caret, percent, parentheses and dot
    if (/^[0-9+\-*/^().%]$/.test(ev.key)) {
      expr += ev.key
      refresh()
      return
    }
    // quick insert for pi with 'p' or 'P'
    if (ev.key === 'p' || ev.key === 'P') {
      expr += 'pi'
      refresh()
      return
    }
  })

  // init display
  refresh()
})()
