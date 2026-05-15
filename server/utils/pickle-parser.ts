export function parsePickle(res: string): any {
  const stack: any[] = [];
  const memo: any = {};
  const markStack: number[] = [];

  let i = 0;
  try {
    while (i < res.length) {
      const char = res[i];

      if (char === '(') {
        markStack.push(stack.length);
        i++;
      } else if (char === 'd') {
        const mark = markStack.length > 0 ? markStack.pop()! : 0;
        const items = stack.splice(mark);
        const dict: any = {};
        for (let j = 0; j < items.length; j += 2) {
          if (j + 1 < items.length) {
            dict[items[j]] = items[j + 1];
          }
        }
        stack.push(dict);
        i++;
      } else if (char === 'l') {
        const mark = markStack.length > 0 ? markStack.pop()! : 0;
        const items = stack.splice(mark);
        stack.push(items);
        i++;
      } else if (char === 'S') {
        i++;
        let quoteChar = res[i];
        let start = i + 1;
        let end = start;
        let escaped = false;
        while (end < res.length) {
          if (escaped) {
            escaped = false;
          } else if (res[end] === '\\') {
            escaped = true;
          } else if (res[end] === quoteChar) {
            break;
          }
          end++;
        }
        const rawStr = res.substring(start, end);
        const str = rawStr.replace(/\\(.)/g, '$1');
        stack.push(str);
        i = end + 1;
      } else if (char === 'p') {
        i++;
        let start = i;
        while (i < res.length && /\d/.test(res[i])) {
          i++;
        }
        const index = res.substring(start, i);
        if (index !== '' && stack.length > 0) {
          memo[index] = stack[stack.length - 1];
        }
      } else if (char === 'g') {
        i++;
        let start = i;
        while (i < res.length && /\d/.test(res[i])) {
          i++;
        }
        const index = res.substring(start, i);
        if (memo[index] !== undefined) {
          stack.push(memo[index]);
        }
      } else if (char === 'a') {
        if (stack.length >= 2) {
          const value = stack.pop();
          const list = stack[stack.length - 1];
          if (Array.isArray(list)) {
            list.push(value);
          }
        }
        i++;
      } else if (char === 's') {
        if (stack.length >= 3) {
          const value = stack.pop();
          const key = stack.pop();
          const dict = stack[stack.length - 1];
          if (dict && typeof dict === 'object' && !Array.isArray(dict)) {
            dict[key] = value;
          }
        }
        i++;
      } else if (char === '.') {
        return stack.pop();
      } else if (/\s/.test(char)) {
        i++;
      } else {
        i++;
      }
    }
  } catch (e) {
    console.error('Pickle parse error at index ' + i, e);
  }
  return stack.pop();
}
