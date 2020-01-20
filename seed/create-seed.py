import json
import base64
import syft as sy
import torch as th
from syft.serde import protobuf
from syft.messaging.message import ObjectMessage

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


def serializeToBase64Pb(worker, obj):
    pb = protobuf.serde._bufferize(worker, obj)
    bin = pb.SerializeToString()
    return base64.b64encode(bin).decode('utf-8')

def generateProtobufProtocol(me):
    @sy.func2plan(args_shape=[(1,)])
    def plan1(x):
        y = x + x
        z = th.abs(y)
        return z

    @sy.func2plan(args_shape=[(1,)])
    def plan2(x):
        y = x + x
        z = th.abs(y)
        return z

    tensor1 = th.tensor([[1, 2, 3], [4, 5, 6.1]])
    tensor2 = th.tensor([[1, 2, 3], [4, 5, 6.1]])
    plan1.id = tensor1.id
    plan2.id = tensor2.id

    protocol = sy.Protocol([("worker1", plan1), ("worker2", plan2)])
    # This is not real Plan yet; Plan serialization is not possible yet
    obj_msg1 = ObjectMessage(tensor1)
    obj_msg2 = ObjectMessage(tensor2)
    return {
        "protocol": serializeToBase64Pb(me, protocol),
        "plan1": serializeToBase64Pb(me, obj_msg1),
        "plan2": serializeToBase64Pb(me, obj_msg2),
    }

sy.create_sandbox(globals(), download_data=False)
hook.local_worker.is_client_worker = False
hook.local_worker.framework = None
me = hook.local_worker

first = generateThreeWayProtocol(me)
second = generateTwoWayProtocol(me)
protobufProtocol = generateProtobufProtocol(me)

data = { "three-way": first, "two-way": second, "protobuf-protocol": protobufProtocol }

print(data)
print("\n----------\n\nSeed file created successfully!")

with open('./seed/data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f)