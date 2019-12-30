import json

import syft as sy
import torch as th

def generateThreeWayProtocol(me):
    @sy.func2plan(args_shape=[(1,)], state=(th.tensor([4.2, 7.3]), ))
    def bobPlan(x, state):
        bias, = state.read()
        y = x + bias
        z = th.abs(y)
        return z

    @sy.func2plan(args_shape=[(1,)])
    def theoPlan(x):
        y = x + x
        z = th.abs(y)
        return z

    @sy.func2plan(args_shape=[(1,)])
    def alicePlan(x):
        y = x + x
        z = th.abs(y)
        return z

    protocol = sy.Protocol([("worker1", bobPlan), ("worker2", theoPlan), ("worker3", alicePlan)])

    # Simplify the protocol
    simplifiedProtocol = sy.serde.msgpack.serde._simplify(me, protocol)

    # Simplify bobPlan
    simplifiedBobPlan = sy.serde.msgpack.serde._simplify(me, bobPlan)

    # Simplify theoPlan
    simplifiedTheoPlan = sy.serde.msgpack.serde._simplify(me, theoPlan)

    # Simplify alicePlan
    simplifiedAlicePlan = sy.serde.msgpack.serde._simplify(me, alicePlan)

    return {
        "protocol": str(simplifiedProtocol),
        "bob": str(simplifiedBobPlan),
        "theo": str(simplifiedTheoPlan),
        "alice": str(simplifiedAlicePlan)
    }

def generateTwoWayProtocol(me):
    @sy.func2plan(args_shape=[(1,)], state=(th.tensor([4.2, 7.3]), ))
    def jasonPlan(x, state):
        bias, = state.read()
        y = x + bias
        z = th.abs(y)
        return z

    @sy.func2plan(args_shape=[(1,)])
    def andyPlan(x):
        y = x + x
        z = th.abs(y)
        return z

    protocol2 = sy.Protocol([("worker1", jasonPlan), ("worker2", andyPlan)])

    # Simplify the protocol
    simplifiedProtocol = sy.serde.msgpack.serde._simplify(me, protocol2)

    # Simplify jasonPlan
    simplifiedJasonPlan = sy.serde.msgpack.serde._simplify(me, jasonPlan)

    # Simplify andyPlan
    simplifiedAndyPlan = sy.serde.msgpack.serde._simplify(me, andyPlan)

    return {
        "protocol": str(simplifiedProtocol),
        "jason": str(simplifiedJasonPlan),
        "andy": str(simplifiedAndyPlan)
    }

sy.create_sandbox(globals(), download_data=False)
hook.local_worker.is_client_worker = False
hook.local_worker.framework = None
me = hook.local_worker

first = generateThreeWayProtocol(me)
second = generateTwoWayProtocol(me)
data = { "three-way": first, "two-way": second }

print(data)
print("\n----------\n\nSeed file created successfully!")

with open('./seed/data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f)