/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 8] */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const isNode = require('detect-node')
const loadFixture = require('aegir/fixtures')

const FactoryClient = require('./ipfs-factory/client')

const testfile = isNode
  ? loadFixture(__dirname, '/fixtures/testfile.txt')
  : loadFixture(__dirname, 'fixtures/testfile.txt')

describe('.files (the MFS API part)', function () {
  this.timeout(120 * 1000)

  let ipfs
  let fc

  const expectedMultihash = 'Qma4hjFTnCasJ8PVp3mZbZK5g2vGDT4LByLJ7m8ciyRFZP'

  before((done) => {
    fc = new FactoryClient()
    fc.spawnNode((err, node) => {
      expect(err).to.not.exist()
      ipfs = node
      done()
    })
  })

  after((done) => fc.dismantle(done))

  describe('Callback API', function () {
    this.timeout(120 * 1000)

    it('add file for testing', (done) => {
      ipfs.files.add(testfile, (err, res) => {
        expect(err).to.not.exist()

        expect(res).to.have.length(1)
        expect(res[0].hash).to.equal(expectedMultihash)
        expect(res[0].path).to.equal(expectedMultihash)
        done()
      })
    })

    it('files.add with cid-version=1 and raw-leaves=false', (done) => {
      const expectedCid = 'zdj7Wh9x6gXdg4UAqhRYnjBTw9eJF7hvzUU4HjpnZXHYQz9jK'
      const options = { 'cid-version': 1, 'raw-leaves': false }

      ipfs.files.add(testfile, options, (err, res) => {
        expect(err).to.not.exist()

        expect(res).to.have.length(1)
        expect(res[0].hash).to.equal(expectedCid)
        expect(res[0].path).to.equal(expectedCid)
        done()
      })
    })

    it('files.add with options', (done) => {
      ipfs.files.add(testfile, { pin: false }, (err, res) => {
        expect(err).to.not.exist()

        expect(res).to.have.length(1)
        expect(res[0].hash).to.equal(expectedMultihash)
        expect(res[0].path).to.equal(expectedMultihash)
        done()
      })
    })

    it('files.mkdir', (done) => {
      ipfs.files.mkdir('/test-folder', done)
    })

    it('files.cp', (done) => {
      ipfs.files.cp([
        '/ipfs/Qma4hjFTnCasJ8PVp3mZbZK5g2vGDT4LByLJ7m8ciyRFZP',
        '/test-folder/test-file'
      ], (err) => {
        expect(err).to.not.exist()
        done()
      })
    })

    it('files.ls', (done) => {
      ipfs.files.ls('/test-folder', (err, res) => {
        expect(err).to.not.exist()
        expect(res.Entries.length).to.equal(1)
        done()
      })
    })

    it('files.write', (done) => {
      ipfs.files
        .write('/test-folder/test-file-2.txt', Buffer.from('hello world'), {create: true}, (err) => {
          expect(err).to.not.exist()

          ipfs.files.read('/test-folder/test-file-2.txt', (err, stream) => {
            expect(err).to.not.exist()

            let buf = ''
            stream
              .on('error', (err) => expect(err).to.not.exist())
              .on('data', (data) => {
                buf += data
              })
              .on('end', () => {
                expect(buf).to.be.equal('hello world')
                done()
              })
          })
        })
    })

    it('files.write without options', (done) => {
      ipfs.files
        .write('/test-folder/test-file-2.txt', Buffer.from('hello world'), (err) => {
          expect(err).to.not.exist()

          ipfs.files.read('/test-folder/test-file-2.txt', (err, stream) => {
            expect(err).to.not.exist()

            let buf = ''
            stream
              .on('error', (err) => {
                expect(err).to.not.exist()
              })
              .on('data', (data) => {
                buf += data
              })
              .on('end', () => {
                expect(buf).to.be.equal('hello world')
                done()
              })
          })
        })
    })

    it('files.stat', (done) => {
      ipfs.files.stat('/test-folder/test-file', (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.deep.equal({
          Hash: 'Qma4hjFTnCasJ8PVp3mZbZK5g2vGDT4LByLJ7m8ciyRFZP',
          Size: 12,
          CumulativeSize: 20,
          Blocks: 0,
          Type: 'file'
        })

        done()
      })
    })

    it('files.stat file that does not exist()', (done) => {
      ipfs.files.stat('/test-folder/does-not-exist()', (err, res) => {
        expect(err).to.exist()
        if (err.code === 0) {
          return done()
        }
        throw err
      })
    })

    it('files.read', (done) => {
      if (!isNode) {
        return done()
      }

      ipfs.files.read('/test-folder/test-file', (err, stream) => {
        expect(err).to.not.exist()
        let buf = ''
        stream
          .on('error', (err) => {
            expect(err).to.not.exist()
          })
          .on('data', (data) => {
            buf += data
          })
          .on('end', () => {
            expect(Buffer.from(buf)).to.deep.equal(testfile)
            done()
          })
      })
    })

    it('files.rm without options', (done) => {
      ipfs.files.rm('/test-folder/test-file-2.txt', done)
    })

    it('files.rm', (done) => {
      ipfs.files.rm('/test-folder', {recursive: true}, done)
    })
  })

  describe('Promise API', function () {
    this.timeout(120 * 1000)

    it('files.add', () => {
      return ipfs.files.add(testfile)
        .then((res) => {
          expect(res).to.have.length(1)
          expect(res[0].hash).to.equal(expectedMultihash)
          expect(res[0].path).to.equal(expectedMultihash)
        })
    })

    it('files.add with cid-version=1 and raw-leaves=false', () => {
      const expectedHash = 'zdj7Wh9x6gXdg4UAqhRYnjBTw9eJF7hvzUU4HjpnZXHYQz9jK'
      const options = { 'cid-version': 1, 'raw-leaves': false }

      return ipfs.files.add(testfile, options)
        .then((res) => {
          expect(res).to.have.length(1)
          expect(res[0].hash).to.equal(expectedHash)
          expect(res[0].path).to.equal(expectedHash)
        })
    })

    it('files.add with options', () => {
      return ipfs.files.add(testfile, { pin: false })
        .then((res) => {
          expect(res).to.have.length(1)
          expect(res[0].hash).to.equal(expectedMultihash)
          expect(res[0].path).to.equal(expectedMultihash)
        })
    })

    it('files.mkdir', () => {
      return ipfs.files.mkdir('/test-folder')
    })

    it('files.cp', () => {
      return ipfs.files
        .cp([
          '/ipfs/Qma4hjFTnCasJ8PVp3mZbZK5g2vGDT4LByLJ7m8ciyRFZP',
          '/test-folder/test-file'
        ])
    })

    it('files.ls', () => {
      return ipfs.files.ls('/test-folder')
        .then((res) => {
          expect(res.Entries.length).to.equal(1)
        })
    })

    it('files.write', (done) => {
      ipfs.files
        .write('/test-folder/test-file-2.txt', Buffer.from('hello world'), {create: true})
        .then(() => {
          return ipfs.files.read('/test-folder/test-file-2.txt')
        })
        .then((stream) => {
          let buf = ''
          stream
            .on('error', (err) => {
              expect(err).to.not.exist()
            })
            .on('data', (data) => {
              buf += data
            })
            .on('end', () => {
              expect(buf).to.be.equal('hello world')
              done()
            })
        })
        .catch(done)
    })

    it('files.write without options', (done) => {
      ipfs.files
        .write('/test-folder/test-file-2.txt', Buffer.from('hello world'))
        .then(() => {
          return ipfs.files.read('/test-folder/test-file-2.txt')
        })
        .then((stream) => {
          let buf = ''
          stream
            .on('error', (err) => {
              expect(err).to.not.exist()
            })
            .on('data', (data) => {
              buf += data
            })
            .on('end', () => {
              expect(buf).to.be.equal('hello world')
              done()
            })
        })
        .catch(done)
    })

    it('files.stat', () => {
      return ipfs.files.stat('/test-folder/test-file')
        .then((res) => {
          expect(res).to.deep.equal({
            Hash: 'Qma4hjFTnCasJ8PVp3mZbZK5g2vGDT4LByLJ7m8ciyRFZP',
            Size: 12,
            CumulativeSize: 20,
            Blocks: 0,
            Type: 'file'
          })
        })
    })

    it('files.stat file that does not exist()', () => {
      return ipfs.files.stat('/test-folder/does-not-exist()')
        .catch((err) => {
          expect(err).to.exist()
          expect(err.code).to.be.eql(0)
        })
    })

    it('files.read', (done) => {
      if (!isNode) { return done() }

      ipfs.files.read('/test-folder/test-file')
        .then((stream) => {
          let buf = ''
          stream
            .on('error', (err) => {
              expect(err).to.not.exist()
            })
            .on('data', (data) => {
              buf += data
            })
            .on('end', () => {
              expect(Buffer.from(buf)).to.eql(testfile)
              done()
            })
        })
    })

    it('files.rm without options', () => {
      return ipfs.files.rm('/test-folder/test-file-2.txt')
    })

    it('files.rm', () => {
      return ipfs.files.rm('/test-folder', { recursive: true })
    })
  })
})
