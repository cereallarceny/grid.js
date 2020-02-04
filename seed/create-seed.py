import json
import base64
import syft as sy
import torch as th
from syft.serde import protobuf

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
    protocolPb, simplifiedProtocol = serializeToBase64Pb(me, protocol)

    # Simplify bobPlan
    bobPlanPb, simplifiedBobPlan = serializeToBase64Pb(me, bobPlan)

    # Simplify theoPlan
    theoPlanPb, simplifiedTheoPlan = serializeToBase64Pb(me, theoPlan)

    # Simplify alicePlan
    alicePlanPb, simplifiedAlicePlan = serializeToBase64Pb(me, alicePlan)

    return {
        "protocol": str(simplifiedProtocol),
        "_protocol": str(protocolPb),
        "bob": str(simplifiedBobPlan),
        "_bob": str(bobPlanPb),
        "theo": str(simplifiedTheoPlan),
        "_theo": str(theoPlanPb),
        "alice": str(simplifiedAlicePlan),
        "_alice": str(alicePlanPb),
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
    protocolPb, simplifiedProtocol = serializeToBase64Pb(me, protocol2)

    # Simplify jasonPlan
    jasonPlanPb, simplifiedJasonPlan = serializeToBase64Pb(me, jasonPlan)

    # Simplify andyPlan
    andyPlanPb, simplifiedAndyPlan = serializeToBase64Pb(me, andyPlan)

    return {
        "protocol": str(simplifiedProtocol),
        "_protocol": str(protocolPb),
        "jason": str(simplifiedJasonPlan),
        "_jason": str(jasonPlanPb),
        "andy": str(simplifiedAndyPlan),
        "_andy": str(andyPlanPb),
    }


def serializeToBase64Pb(worker, obj):
    pb = protobuf.serde._bufferize(worker, obj)
    bin = pb.SerializeToString()
    return pb, base64.b64encode(bin).decode('utf-8')

# Replace ID_PROVIDER so we have same nice IDs every time
sy.ID_PROVIDER = [ int(1e10) + i for i in reversed(range(100)) ]

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