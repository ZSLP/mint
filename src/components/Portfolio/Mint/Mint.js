import React, { useState } from "react";
import styled from "styled-components";
import { ButtonQR } from "badger-components-react";
import { WalletContext } from "../../../utils/context";
import mintToken from "../../../utils/broadcastTransaction";
import { Card, Icon, Form, Input, Button, Spin, notification } from "antd";
import { Row, Col } from "antd";
import Paragraph from "antd/lib/typography/Paragraph";
import { HammerIcon } from "../../Common/CustomIcons";
import { FormItemWithQRCodeAddon } from "../EnhancedInputs";
import { getRestUrl } from "../../../utils/withSLP";

const StyledButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  ${ButtonQR} {
    button {
      display: none;
    }
  }
`;

const Mint = ({ token, onClose }) => {
  const ContextValue = React.useContext(WalletContext);
  const { wallet, balances } = ContextValue;
  const [formData, setFormData] = useState({
    dirty: true,
    quantity: 0,
    baton: wallet.Path245.slpAddress
  });
  const [loading, setLoading] = useState(false);

  async function submit() {
    setFormData({
      ...formData,
      dirty: false
    });

    if (!formData.baton || !formData.quantity || Number(formData.quantity) <= 0) {
      return;
    }

    setLoading(true);
    const { quantity, baton } = formData;

    try {
      const link = await mintToken(wallet, {
        tokenId: token.tokenId,
        additionalTokenQty: quantity,
        batonReceiverAddress: baton
      });

      notification.success({
        message: "Success",
        description: (
          <a href={link} target="_blank" rel="noopener noreferrer">
            <Paragraph>Transaction successful. Click or tap here for more details</Paragraph>
          </a>
        ),
        duration: 2
      });

      onClose();
      setLoading(false);
    } catch (e) {
      let message;

      if (/don't have the minting baton/.test(e.message)) {
        message = e.message;
      } else if (/Invalid BCH address/.test(e.message)) {
        message = "Invalid ZCL address";
      } else if (!e.error) {
        message = `Transaction failed: no response from ${getRestUrl()}.`;
      } else if (/Could not communicate with full node or other external service/.test(e.error)) {
        message = "Could not communicate with API. Please try again.";
      } else {
        message = e.message || e.error || JSON.stringify(e);
      }

      notification.error({
        message: "Error",
        description: message,
        duration: 2
      });
      console.error(e);
      setLoading(false);
    }
  }

  const handleChange = e => {
    const { value, name } = e.target;

    setFormData(p => ({ ...p, [name]: value }));
  };

  return (
    <Row type="flex">
      <Col span={24}>
        <Spin spinning={loading}>
          <Card
            title={
              <h2>
                <HammerIcon /> Mint
              </h2>
            }
            bordered={false}
          >
            <br />
            <Row justify="center" type="flex">
              <Col>
                <StyledButtonWrapper>
                  {!balances.totalBalance ? (
                    <>
                      <br />
                      <Paragraph>
                        <ButtonQR
                          toAddress={wallet.Path145.cashAddress}
                          sizeQR={125}
                          step={"fresh"}
                          amountSatoshis={0}
                        />
                      </Paragraph>
                      <Paragraph style={{ overflowWrap: "break-word" }} copyable>
                        {wallet.Path145.cashAddress}
                      </Paragraph>
                      <Paragraph>You currently have 0 ZCL.</Paragraph>
                      <Paragraph>
                        Deposit some ZCL in order to pay for the transaction that will mint the
                        token
                      </Paragraph>
                    </>
                  ) : null}
                </StyledButtonWrapper>
              </Col>
            </Row>
            <Row type="flex">
              <Col span={24}>
                <Form style={{ width: "auto" }}>
                  <FormItemWithQRCodeAddon
                    validateStatus={!formData.dirty && !formData.baton ? "error" : ""}
                    help={
                      !formData.dirty && !formData.baton ? "Should be a valid zslp address" : ""
                    }
                    onScan={result => setFormData({ ...formData, address: result })}
                    inputProps={{
                      placeholder: "Baton (zslp address)",
                      name: "baton",
                      onChange: e => handleChange(e),
                      required: true,
                      value: formData.baton
                    }}
                  />
                  <Form.Item
                    validateStatus={
                      !formData.dirty && Number(formData.quantity) <= 0 ? "error" : ""
                    }
                    help={
                      !formData.dirty && Number(formData.quantity) <= 0
                        ? "Should be greater than 0"
                        : ""
                    }
                  >
                    <Input
                      prefix={<Icon type="block" />}
                      placeholder="Amount"
                      name="quantity"
                      onChange={e => handleChange(e)}
                      required
                      type="number"
                    />
                  </Form.Item>
                  <div style={{ paddingTop: "12px" }}>
                    <Button onClick={() => submit()}>Mint</Button>
                  </div>
                </Form>
              </Col>
            </Row>
          </Card>
        </Spin>
      </Col>
    </Row>
  );
};

export default Mint;
