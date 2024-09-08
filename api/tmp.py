import json
import numpy as np

import gurobipy as gp

with open("tmpData/data.json", "r") as f:
    data = json.load(f)


RawMaterialCapacity = np.array(data["RawMaterialCapacity"])
LaborRequired = np.array(data["LaborRequired"])
MachineTimeCapacity = np.array(data["MachineTimeCapacity"])
T = data["T"]
LaborCapacity = np.array(data["LaborCapacity"])
MachineTimeRequired = np.array(data["MachineTimeRequired"])
RawMaterialsRequired = np.array(data["RawMaterialsRequired"])
R = data["R"]
P = data["P"]
RevenuePerProduct = np.array(data["RevenuePerProduct"])
L = data["L"]

# Define model
model = gp.Model("model")

ProductsProduced = model.addVars(P, vtype=gp.GRB.CONTINUOUS, name="ProductsProduced")

# Ensure products are produced in integral quantities
model.addVars(P, vtype=gp.GRB.INTEGER, name="ProductsProduced")


# Add raw material capacity constraints
for r in range(R):
    model.addConstr(
        gp.quicksum(ProductsProduced[p] * RawMaterialsRequired[p, r] for p in range(P))
        <= RawMaterialCapacity[r],
        name=f"raw_material_capacity_{r}",
    )

# Add machine time capacity constraints for each machine time category
for t in range(T):
    model.addConstr(
        gp.quicksum(ProductsProduced[p] * MachineTimeRequired[p, t] for p in range(P))
        <= MachineTimeCapacity[t],
        name=f"machine_time_capacity_{t}",
    )

# Add labor capacity constraints for each labor category
for l in range(L):
    model.addConstr(
        gp.quicksum(ProductsProduced[p] * LaborRequired[p, l] for p in range(P))
        <= LaborCapacity[l],
        name="labor_capacity_{}".format(l),
    )

# Set objective
model.setObjective(
    gp.quicksum(RevenuePerProduct[p] * ProductsProduced[p] for p in range(P)),
    gp.GRB.MAXIMIZE,
)

# Optimize model
model.optimize()


# Get model status
status = model.status

# Get solver information
print(status, gp.GRB.OPTIMAL)
solving_info = {}
if status == gp.GRB.OPTIMAL:
    solving_info["status"] = model.status
    solving_info["objective_value"] = model.objVal
    solving_info["variables"] = [
        {
            "symbol": var.VarName,
            "value": var.X,
        }
        for var in model.getVars()
    ]
    solving_info["runtime"] = model.Runtime
    solving_info["iteration_count"] = model.IterCount

print(solving_info)

# Get objective value
obj_val = model.objVal
