class CANopenNode:
    def __init__(self, node_id):
        self.node_id = node_id
        self.message_handlers = {}

    def send_message(self, cob_id, data):
        if cob_id in self.message_handlers:
            self.message_handlers[cob_id](data)
        else:
            print(f"Node {self.node_id}: Sending message on COB-ID {cob_id}: {data}")

    def add_message_handler(self, cob_id, handler):
        self.message_handlers[cob_id] = handler

# Create a simulated CANopen node
node = CANopenNode(node_id=1)

# Define message handler
def handle_message(data):
    print(f"Received message: {data}")

# Register the message handler
node.add_message_handler(cob_id=0x101, handler=handle_message)

# Simulate sending a message
node.send_message(cob_id=0x101, data=[0x01, 0x02, 0x03])
