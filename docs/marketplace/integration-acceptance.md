# AirVibe LoRaWAN integration acceptance checklist

Draft test procedure. Execute against the actual shipping hardware, firmware and target network. Record Pass, Fail or Not tested for each item; this checklist does not assert completed tests or approval.

## Record the configuration

Record hardware model and revision, regional frequency plan, TPM and VSM firmware, protocol version, network server and device profile, gateway model, application version, codec filename/hash and date. Confirm the applicable LoRaWAN MAC and regional-parameters versions with the device owner. Keep AppKey and other secrets in approved credential storage, not test reports or Git.

## Commission and decode

1. Confirm the device variant and gateway support the deployment region. Provision OTAA using the device's authorized activation workflow. Follow the wiki quickstart for the magnetic wake switch and join tones.
2. Verify join success and receive the current-configuration uplink. Compare TPM/VSM versions and settings with the approved profile.
3. Decode an overall uplink and check units for all three acceleration and velocity axes, temperature, battery and status. Compare against a controlled reference reading; record the reference and acceptance tolerance supplied by engineering.
4. Send a configuration downlink on port 30 in a controlled test and confirm the resulting configuration. Check overall-only mode before increasing waveform traffic. Record delivery timing and any queue failures.
5. Configure alarm thresholds on port 31 under controlled conditions. Verify alarm bitmask and null handling for unreported channels. Verify machine-off behavior separately; null is not a zero reading.

## Verify waveform delivery

Use the wiki Time Waveform Collection Process as the protocol source. Confirm information acknowledgment on port 20, transaction association, duplicate handling, segment assembly, final-segment handling, and recovery requests on port 21. A decoder alone is insufficient to complete a waveform transaction. Record success only after completeness is verified and the final acknowledgment is sent.

Measure the intended reporting schedule under representative radio conditions before making capacity, range, latency or battery-life claims. A configured acquisition sampling rate does not imply continuous radio streaming.

## Optional firmware update test

With a compatible approved image and recovery procedure, test the wiki OTA sequence, Class C transition, missing-block recovery and return to Class A. Record pre/post firmware versions. A successful CRC is not evidence of signed-image authentication or certification; document security properties from the actual implementation separately.

## Submission evidence

Attach redacted result records with versions and timestamps, the tested codec hash, profile settings, known limitations, and an engineering reviewer. Ask the marketplace's technical reviewer to identify any additional interoperability tests. Keep private identifiers and raw payload captures in approved restricted evidence storage.

## Hardware documentation still required

Before a customer installation manual or final datasheet is released, engineering must supply model-specific dimensions and mass with units, mounting method/torque, cable options and axis orientation, operating/storage limits for both modules, ingress rating, battery specification/replacement instructions, regional ordering codes, and safety instructions. Compliance must supply applicable certificate numbers, scope, revision and approved labeling. These inputs cannot be inferred from a protocol reference.
