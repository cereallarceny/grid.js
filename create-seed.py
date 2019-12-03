import sys
import os

sys.path.append(os.path.abspath(sys.argv[1]))

import syft as sy
import torch as th

sy.create_sandbox(globals(), download_data=False)

@sy.func2plan([th.Size((2,))])
def plan_double_abs(x):
    a = x + x
    b = th.abs(a)
    return b

samples = {
  "torch.Tensor": th.randn(1,3),
  "torch.Size": th.randn(3).size(),
  "Plan": plan_double_abs,
  "PointerTensor": th.randn(1,3).send(bob).create_pointer(),
}

for (name, value) in samples.items():
    print(name, value.__class__)
    print(sy.serde._simplify(value))