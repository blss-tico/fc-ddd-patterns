import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    // create order
    const customerRepository = new CustomerRepository();
    const customer = new Customer("10", "Customer 10");
    const address = new Address("Street 1", 250, "Zipcode 1-250", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 123", 1050);
    await productRepository.create(product);

    const orderItem = new OrderItem("1", product.name, product.price, product.id, 2);
    const order = new Order("1", "10", [orderItem]);
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    // find order
    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    // check results
    expect(orderModel.toJSON()).toStrictEqual({
      id: "1",
      customer_id: "10",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "1",
          product_id: "123",
        },
      ],
    });
  });

  it("should update an order", async () => {
    // create an order
    const customerRepository = new CustomerRepository();
    const customer = new Customer("2", "Customer 2");
    const address = new Address("Street A", 32, "Zipcode A-32", "City A");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product1 = new Product("B11", "Product B11", 50);
    await productRepository.create(product1);

    const orderItem1 = new OrderItem("1", product1.name, product1.price, product1.id, 1);
    const order = new Order("1", "2", [orderItem1]);
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderResult = await orderRepository.find(order.id);
    expect(order).toStrictEqual(orderResult);

    // modify order to update
    const productRepository2 = new ProductRepository();
    const product2 = new Product("B33", "Product B33", 20);
    await productRepository2.create(product2);

    const orderItem2 = new OrderItem("2", product2.name, product2.price, product2.id, 3);
    const order2 = new Order("1", "2", [orderItem1, orderItem2]);
    const orderRepository2 = new OrderRepository();
    await orderRepository2.update(order2);

    // check results
    const orderResult2 = await orderRepository.find(order2.id);
    expect(order2).toStrictEqual(orderResult2);
  });

  it("should find one order", async () => {
    // create order
    const customerRepository = new CustomerRepository();
    const customer = new Customer("124", "Customer 4");
    const address = new Address("Street 4", 1, "Zipcode 4", "City 4");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("124", "Product 4", 14);
    const product2 = new Product("125", "Product 5", 5);
    await productRepository.create(product);
    await productRepository.create(product2);

    const orderItem = new OrderItem("1", product.name, product.price, product.id, 4);
    const orderItem2 = new OrderItem("2", product2.name, product2.price, product2.id, 1);

    const order = new Order("124", "124", [orderItem, orderItem2]);
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    // check results
    const orderResult = await orderRepository.find(order.id);
    expect(order).toStrictEqual(orderResult);
  });

  it("should find all orders", async () => {
    // create orders
    const customerRepository = new CustomerRepository();
    const customer = new Customer("3", "Customer 3");
    const address = new Address("Street C", 232, "Zipcode C-232", "City C");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product1 = new Product("Z99", "Product Z99", 1150);
    const product2 = new Product("S46", "Product S46", 567);
    const product3 = new Product("G22", "Product G22", 2388);
    const product4 = new Product("H67", "Product H67", 1299);
    await productRepository.create(product1);
    await productRepository.create(product2);
    await productRepository.create(product3);
    await productRepository.create(product4);

    const orderItem1 = new OrderItem("1", product1.name, product1.price, product1.id, 2);
    const orderItem2 = new OrderItem("2", product2.name, product2.price, product2.id, 5);
    const orderItem3 = new OrderItem("3", product3.name, product3.price, product3.id, 3);
    const orderItem4 = new OrderItem("4", product4.name, product4.price, product4.id, 1);

    const order1 = new Order("1", "3", [orderItem1, orderItem2]);
    const order2 = new Order("2", "3", [orderItem3, orderItem4]);
    const orderRepository = new OrderRepository();
    await orderRepository.create(order1);
    await orderRepository.create(order2);

    // find all orders
    const orders = await orderRepository.findAll();

    // check results
    expect(orders).toHaveLength(2);
    expect(orders).toContainEqual(order1);
    expect(orders).toContainEqual(order2);
  });
});
